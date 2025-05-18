/**
 * Session model
 */
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const { NotFoundError } = require('../utils/errorTypes');

class Session {
  /**
   * Create a new session
   * @param {Object} sessionData - Session data
   * @returns {Object} Created session object
   */
  static async create(sessionData) {
    // Generate a UUID if not provided
    const id = sessionData.id || uuidv4();
    
    // Insert the session into the database
    const [session] = await db('sessions')
      .insert({
        id,
        seeker_id: sessionData.seeker_id,
        professional_id: sessionData.professional_id,
        zoom_meeting_id: sessionData.zoom_meeting_id,
        zoom_meeting_url: sessionData.zoom_meeting_url,
        zoom_meeting_password: sessionData.zoom_meeting_password,
        scheduled_at: sessionData.scheduled_at,
        duration_minutes: sessionData.duration_minutes || 30,
        status: sessionData.status || 'scheduled'
      })
      .returning('*');
    
    return session;
  }

  /**
   * Find a session by ID
   * @param {string} id - Session ID
   * @param {boolean} includeUsers - Whether to include user data
   * @returns {Object|null} Session object or null if not found
   */
  static async findById(id, includeUsers = false) {
    let query = db('sessions')
      .where('sessions.id', id)
      .first();
    
    if (includeUsers) {
      query = query
        .select(
          'sessions.*',
          'seeker.first_name as seeker_first_name',
          'seeker.last_name as seeker_last_name',
          'seeker.email as seeker_email',
          'seeker.is_anonymized as seeker_is_anonymized',
          'professional.first_name as professional_first_name',
          'professional.last_name as professional_last_name',
          'professional.email as professional_email',
          'professional.is_anonymized as professional_is_anonymized',
          'professional_profiles.job_title',
          'professional_profiles.hourly_rate'
        )
        .join('users as seeker', 'sessions.seeker_id', 'seeker.id')
        .join('users as professional', 'sessions.professional_id', 'professional.id')
        .leftJoin('professional_profiles', 'professional.id', 'professional_profiles.user_id');
    }
    
    const session = await query;
    
    return session || null;
  }

  /**
   * Update a session
   * @param {string} id - Session ID
   * @param {Object} sessionData - Session data to update
   * @returns {Object} Updated session object
   */
  static async update(id, sessionData) {
    // Check if session exists
    const existingSession = await this.findById(id);
    
    if (!existingSession) {
      throw new NotFoundError('Session not found');
    }
    
    // Create update object
    const updateData = {};
    
    // Only include fields that are provided
    if (sessionData.zoom_meeting_id !== undefined) updateData.zoom_meeting_id = sessionData.zoom_meeting_id;
    if (sessionData.zoom_meeting_url !== undefined) updateData.zoom_meeting_url = sessionData.zoom_meeting_url;
    if (sessionData.zoom_meeting_password !== undefined) updateData.zoom_meeting_password = sessionData.zoom_meeting_password;
    if (sessionData.scheduled_at !== undefined) updateData.scheduled_at = sessionData.scheduled_at;
    if (sessionData.duration_minutes !== undefined) updateData.duration_minutes = sessionData.duration_minutes;
    if (sessionData.status !== undefined) updateData.status = sessionData.status;
    if (sessionData.feedback !== undefined) updateData.feedback = sessionData.feedback;
    if (sessionData.rating !== undefined) updateData.rating = sessionData.rating;
    
    // Update the session
    const [updatedSession] = await db('sessions')
      .where({ id })
      .update(updateData)
      .returning('*');
    
    return updatedSession;
  }

  /**
   * Delete a session
   * @param {string} id - Session ID
   * @returns {boolean} True if deleted, false if not found
   */
  static async delete(id) {
    const count = await db('sessions')
      .where({ id })
      .delete();
    
    return count > 0;
  }

  /**
   * List sessions for a user with pagination
   * @param {string} userId - User ID
   * @param {string} role - User role ('seeker' or 'professional')
   * @param {Object} options - Pagination and filter options
   * @returns {Object} Object with sessions array and pagination info
   */
  static async listForUser(userId, role, {
    page = 1,
    limit = 20,
    status,
    startDate,
    endDate,
    includeUsers = false
  }) {
    // Determine which field to filter on based on role
    const userField = role === 'professional' ? 'professional_id' : 'seeker_id';
    
    // Start building the query
    let query = db('sessions').where(userField, userId);
    
    // Apply filters
    if (status) {
      query = query.where('status', status);
    }
    
    if (startDate) {
      query = query.where('scheduled_at', '>=', startDate);
    }
    
    if (endDate) {
      query = query.where('scheduled_at', '<=', endDate);
    }
    
    // Include user data if requested
    if (includeUsers) {
      query = query
        .select(
          'sessions.*',
          'seeker.first_name as seeker_first_name',
          'seeker.last_name as seeker_last_name',
          'seeker.email as seeker_email',
          'seeker.is_anonymized as seeker_is_anonymized',
          'professional.first_name as professional_first_name',
          'professional.last_name as professional_last_name',
          'professional.email as professional_email',
          'professional.is_anonymized as professional_is_anonymized',
          'professional_profiles.job_title',
          'professional_profiles.hourly_rate'
        )
        .join('users as seeker', 'sessions.seeker_id', 'seeker.id')
        .join('users as professional', 'sessions.professional_id', 'professional.id')
        .leftJoin('professional_profiles', 'professional.id', 'professional_profiles.user_id');
    }
    
    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.orderBy('scheduled_at', 'desc').offset(offset).limit(limit);
    
    // Execute query
    const sessions = await query;
    
    // Get total count for pagination
    const [{ count }] = await db('sessions')
      .where(userField, userId)
      .modify(function(queryBuilder) {
        if (status) {
          queryBuilder.where('status', status);
        }
        
        if (startDate) {
          queryBuilder.where('scheduled_at', '>=', startDate);
        }
        
        if (endDate) {
          queryBuilder.where('scheduled_at', '<=', endDate);
        }
      })
      .count('id');
    
    return {
      sessions,
      pagination: {
        total: parseInt(count, 10),
        page,
        limit,
        pages: Math.ceil(parseInt(count, 10) / limit)
      }
    };
  }

  /**
   * Check if a time slot is available for a professional
   * @param {string} professionalId - Professional user ID
   * @param {Date} startTime - Start time
   * @param {Date} endTime - End time
   * @returns {boolean} True if available, false if not
   */
  static async isTimeSlotAvailable(professionalId, startTime, endTime) {
    // Check for overlapping sessions
    const overlappingSessions = await db('sessions')
      .where('professional_id', professionalId)
      .where('status', 'scheduled') // Only consider scheduled sessions
      .where(function() {
        this.where(function() {
          // startTime is between session start and end
          this.where('scheduled_at', '<=', startTime)
            .whereRaw(`scheduled_at + (duration_minutes * interval '1 minute') > ?`, [startTime]);
        })
        .orWhere(function() {
          // endTime is between session start and end
          this.where('scheduled_at', '<', endTime)
            .whereRaw(`scheduled_at + (duration_minutes * interval '1 minute') >= ?`, [endTime]);
        })
        .orWhere(function() {
          // session is completely within the requested slot
          this.where('scheduled_at', '>=', startTime)
            .whereRaw(`scheduled_at + (duration_minutes * interval '1 minute') <= ?`, [endTime]);
        });
      })
      .count('id');
    
    return parseInt(overlappingSessions[0].count, 10) === 0;
  }

  /**
   * Get available time slots for a professional within a date range
   * @param {string} professionalId - Professional user ID
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Array} Array of available time slots
   */
  static async getAvailableTimeSlots(professionalId, startDate, endDate) {
    // First, get the professional's availability settings
    const profile = await db('professional_profiles')
      .where({ user_id: professionalId })
      .select('availability')
      .first();
    
    if (!profile || !profile.availability) {
      return [];
    }
    
    const availability = typeof profile.availability === 'string'
      ? JSON.parse(profile.availability)
      : profile.availability;
    
    // Get all scheduled sessions for the professional within the date range
    const scheduledSessions = await db('sessions')
      .where('professional_id', professionalId)
      .where('status', 'scheduled')
      .whereBetween('scheduled_at', [startDate, endDate])
      .select('scheduled_at', 'duration_minutes');
    
    // Generate available time slots based on availability and scheduled sessions
    // This is a simplified implementation - a real one would account for time zones,
    // working hours, etc.
    const availableSlots = [];
    const currentDate = new Date(startDate);
    const endDateTime = new Date(endDate);
    
    while (currentDate < endDateTime) {
      const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const dayAvailability = availability[dayOfWeek] || {};
      
      if (dayAvailability.available) {
        // Parse start and end times
        const startHour = parseInt(dayAvailability.startTime.split(':')[0], 10);
        const startMinute = parseInt(dayAvailability.startTime.split(':')[1], 10);
        const endHour = parseInt(dayAvailability.endTime.split(':')[0], 10);
        const endMinute = parseInt(dayAvailability.endTime.split(':')[1], 10);
        
        // Create slots every 30 minutes
        for (let hour = startHour; hour < endHour || (hour === endHour && startMinute < endMinute); hour++) {
          for (let minute of [0, 30]) {
            if (hour === startHour && minute < startMinute) continue;
            if (hour === endHour && minute >= endMinute) continue;
            
            const slotStart = new Date(currentDate);
            slotStart.setHours(hour, minute, 0, 0);
            
            const slotEnd = new Date(slotStart);
            slotEnd.setMinutes(slotStart.getMinutes() + 30);
            
            // Check if slot overlaps with any scheduled session
            const isOverlapping = scheduledSessions.some(session => {
              const sessionStart = new Date(session.scheduled_at);
              const sessionEnd = new Date(sessionStart);
              sessionEnd.setMinutes(sessionStart.getMinutes() + session.duration_minutes);
              
              return (
                (slotStart >= sessionStart && slotStart < sessionEnd) ||
                (slotEnd > sessionStart && slotEnd <= sessionEnd) ||
                (slotStart <= sessionStart && slotEnd >= sessionEnd)
              );
            });
            
            if (!isOverlapping) {
              availableSlots.push({
                start: slotStart.toISOString(),
                end: slotEnd.toISOString()
              });
            }
          }
        }
      }
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
      currentDate.setHours(0, 0, 0, 0);
    }
    
    return availableSlots;
  }

  /**
   * Add feedback and rating to a session
   * @param {string} id - Session ID
   * @param {string} feedback - Feedback text
   * @param {number} rating - Rating (1-5)
   * @returns {Object} Updated session
   */
  static async addFeedback(id, feedback, rating) {
    // Check if session exists
    const existingSession = await this.findById(id);
    
    if (!existingSession) {
      throw new NotFoundError('Session not found');
    }
    
    // Validate rating
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }
    
    // Update the session
    const [updatedSession] = await db('sessions')
      .where({ id })
      .update({
        feedback,
        rating
      })
      .returning('*');
    
    return updatedSession;
  }

  /**
   * Mark a session as completed
   * @param {string} id - Session ID
   * @returns {Object} Updated session
   */
  static async markAsCompleted(id) {
    // Check if session exists
    const existingSession = await this.findById(id);
    
    if (!existingSession) {
      throw new NotFoundError('Session not found');
    }
    
    if (existingSession.status !== 'scheduled') {
      throw new Error(`Session status is already ${existingSession.status}`);
    }
    
    // Update the session
    const [updatedSession] = await db('sessions')
      .where({ id })
      .update({
        status: 'completed'
      })
      .returning('*');
    
    return updatedSession;
  }

  /**
   * Cancel a session
   * @param {string} id - Session ID
   * @returns {Object} Updated session
   */
  static async cancel(id) {
    // Check if session exists
    const existingSession = await this.findById(id);
    
    if (!existingSession) {
      throw new NotFoundError('Session not found');
    }
    
    if (existingSession.status !== 'scheduled') {
      throw new Error(`Cannot cancel session with status ${existingSession.status}`);
    }
    
    // Update the session
    const [updatedSession] = await db('sessions')
      .where({ id })
      .update({
        status: 'cancelled'
      })
      .returning('*');
    
    return updatedSession;
  }

  /**
   * Mark a session as no-show
   * @param {string} id - Session ID
   * @returns {Object} Updated session
   */
  static async markAsNoShow(id) {
    // Check if session exists
    const existingSession = await this.findById(id);
    
    if (!existingSession) {
      throw new NotFoundError('Session not found');
    }
    
    if (existingSession.status !== 'scheduled') {
      throw new Error(`Cannot mark session with status ${existingSession.status} as no-show`);
    }
    
    // Update the session
    const [updatedSession] = await db('sessions')
      .where({ id })
      .update({
        status: 'no_show'
      })
      .returning('*');
    
    return updatedSession;
  }
}

module.exports = Session;
