/**
 * Professional Profile model
 */
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const { NotFoundError } = require('../utils/errorTypes');
const anonymizer = require('../utils/anonymizer');

class ProfessionalProfile {
  /**
   * Create a professional profile
   * @param {Object} profileData - Profile data
   * @returns {Object} Created profile
   */
  static async create(profileData) {
    // Generate a UUID if not provided
    const id = profileData.id || uuidv4();
    
    // Insert the profile into the database
    const [profile] = await db('professional_profiles')
      .insert({
        id,
        user_id: profileData.user_id,
        company_id: profileData.company_id,
        industry_id: profileData.industry_id,
        job_title: profileData.job_title,
        expertise_areas: profileData.expertise_areas || [],
        years_experience: profileData.years_experience,
        hourly_rate: profileData.hourly_rate,
        availability: JSON.stringify(profileData.availability || {}),
        zoom_credentials: profileData.zoom_credentials ? JSON.stringify(profileData.zoom_credentials) : null,
        is_available: profileData.is_available !== undefined ? profileData.is_available : true
      })
      .returning('*');
    
    // Parse JSON fields
    if (profile.availability) {
      profile.availability = JSON.parse(profile.availability);
    }
    
    if (profile.zoom_credentials) {
      profile.zoom_credentials = JSON.parse(profile.zoom_credentials);
    }
    
    return profile;
  }

  /**
   * Find a profile by ID
   * @param {string} id - Profile ID
   * @param {boolean} includeUser - Whether to include user data
   * @returns {Object|null} Profile or null if not found
   */
  static async findById(id, includeUser = false) {
    let query = db('professional_profiles')
      .where('professional_profiles.id', id)
      .first();
    
    if (includeUser) {
      query = query
        .join('users', 'professional_profiles.user_id', 'users.id')
        .select(
          'professional_profiles.*',
          'users.email',
          'users.first_name',
          'users.last_name',
          'users.is_anonymized',
          'users.bio',
          'users.profile_picture'
        );
    }
    
    const profile = await query;
    
    if (!profile) {
      return null;
    }
    
    // Parse JSON fields
    if (profile.availability) {
      profile.availability = JSON.parse(profile.availability);
    }
    
    if (profile.zoom_credentials) {
      profile.zoom_credentials = JSON.parse(profile.zoom_credentials);
    }
    
    // If user is included and anonymized, apply anonymization
    if (includeUser && profile.is_anonymized) {
      profile.first_name = anonymizer.anonymizeName(profile.first_name);
      profile.last_name = anonymizer.anonymizeName(profile.last_name);
      profile.email = anonymizer.anonymizeEmail(profile.email);
      
      // Remove sensitive data
      delete profile.zoom_credentials;
    }
    
    return profile;
  }

  /**
   * Find a profile by user ID
   * @param {string} userId - User ID
   * @returns {Object|null} Profile or null if not found
   */
  static async findByUserId(userId) {
    const profile = await db('professional_profiles')
      .where({ user_id: userId })
      .first();
    
    if (!profile) {
      return null;
    }
    
    // Parse JSON fields
    if (profile.availability) {
      profile.availability = JSON.parse(profile.availability);
    }
    
    if (profile.zoom_credentials) {
      profile.zoom_credentials = JSON.parse(profile.zoom_credentials);
    }
    
    return profile;
  }

  /**
   * Update a profile
   * @param {string} id - Profile ID
   * @param {Object} profileData - Profile data to update
   * @returns {Object} Updated profile
   */
  static async update(id, profileData) {
    // Check if profile exists
    const existingProfile = await this.findById(id);
    
    if (!existingProfile) {
      throw new NotFoundError('Professional profile not found');
    }
    
    // Create update object
    const updateData = {};
    
    // Only include fields that are provided
    if (profileData.company_id !== undefined) updateData.company_id = profileData.company_id;
    if (profileData.industry_id !== undefined) updateData.industry_id = profileData.industry_id;
    if (profileData.job_title !== undefined) updateData.job_title = profileData.job_title;
    if (profileData.expertise_areas !== undefined) updateData.expertise_areas = profileData.expertise_areas;
    if (profileData.years_experience !== undefined) updateData.years_experience = profileData.years_experience;
    if (profileData.hourly_rate !== undefined) updateData.hourly_rate = profileData.hourly_rate;
    
    if (profileData.availability !== undefined) {
      updateData.availability = JSON.stringify(profileData.availability);
    }
    
    if (profileData.zoom_credentials !== undefined) {
      updateData.zoom_credentials = profileData.zoom_credentials ? JSON.stringify(profileData.zoom_credentials) : null;
    }
    
    if (profileData.is_available !== undefined) {
      updateData.is_available = profileData.is_available;
    }
    
    // Update the profile
    const [updatedProfile] = await db('professional_profiles')
      .where({ id })
      .update(updateData)
      .returning('*');
    
    // Parse JSON fields
    if (updatedProfile.availability) {
      updatedProfile.availability = JSON.parse(updatedProfile.availability);
    }
    
    if (updatedProfile.zoom_credentials) {
      updatedProfile.zoom_credentials = JSON.parse(updatedProfile.zoom_credentials);
    }
    
    return updatedProfile;
  }

  /**
   * Delete a profile
   * @param {string} id - Profile ID
   * @returns {boolean} True if deleted, false if not found
   */
  static async delete(id) {
    const count = await db('professional_profiles')
      .where({ id })
      .delete();
    
    return count > 0;
  }

  /**
   * List profiles with pagination and filtering
   * @param {Object} options - Pagination and filter options
   * @returns {Object} Object with profiles array and pagination info
   */
  static async list({
    page = 1,
    limit = 20,
    industryId,
    minHourlyRate,
    maxHourlyRate,
    minYearsExperience,
    isAvailable,
    expertise,
    search
  }) {
    // Start building the query
    const query = db('professional_profiles')
      .join('users', 'professional_profiles.user_id', 'users.id')
      .leftJoin('industries', 'professional_profiles.industry_id', 'industries.id')
      .leftJoin('companies', 'professional_profiles.company_id', 'companies.id')
      .select(
        'professional_profiles.id',
        'professional_profiles.job_title',
        'professional_profiles.expertise_areas',
        'professional_profiles.years_experience',
        'professional_profiles.hourly_rate',
        'professional_profiles.is_available',
        'users.first_name',
        'users.last_name',
        'users.is_anonymized',
        'users.bio',
        'users.profile_picture',
        'industries.name as industry_name',
        'companies.name as company_name'
      );
    
    // Apply filters
    if (industryId) {
      query.where('professional_profiles.industry_id', industryId);
    }
    
    if (minHourlyRate !== undefined) {
      query.where('professional_profiles.hourly_rate', '>=', minHourlyRate);
    }
    
    if (maxHourlyRate !== undefined) {
      query.where('professional_profiles.hourly_rate', '<=', maxHourlyRate);
    }
    
    if (minYearsExperience !== undefined) {
      query.where('professional_profiles.years_experience', '>=', minYearsExperience);
    }
    
    if (isAvailable !== undefined) {
      query.where('professional_profiles.is_available', isAvailable);
    } else {
      // By default, only show available professionals
      query.where('professional_profiles.is_available', true);
    }
    
    if (expertise) {
      // Search for expertise in the expertise_areas array
      query.whereRaw("professional_profiles.expertise_areas @> ?::text[]", [[expertise]]);
    }
    
    if (search) {
      query.where(function() {
        this.where('professional_profiles.job_title', 'ilike', `%${search}%`)
          .orWhere('users.first_name', 'ilike', `%${search}%`)
          .orWhere('users.last_name', 'ilike', `%${search}%`)
          .orWhere('industries.name', 'ilike', `%${search}%`)
          .orWhere('companies.name', 'ilike', `%${search}%`);
      });
    }
    
    // Apply pagination
    const offset = (page - 1) * limit;
    query.offset(offset).limit(limit);
    
    // Execute query
    const profiles = await query;
    
    // Apply anonymization for anonymized users
    const anonymizedProfiles = profiles.map(profile => {
      if (profile.is_anonymized) {
        return {
          ...profile,
          first_name: anonymizer.anonymizeName(profile.first_name),
          last_name: anonymizer.anonymizeName(profile.last_name),
          company_name: anonymizer.anonymizeCompany(profile.company_name)
        };
      }
      return profile;
    });
    
    // Get total count for pagination
    const [{ count }] = await db('professional_profiles')
      .count('professional_profiles.id')
      .join('users', 'professional_profiles.user_id', 'users.id')
      .leftJoin('industries', 'professional_profiles.industry_id', 'industries.id')
      .leftJoin('companies', 'professional_profiles.company_id', 'companies.id')
      .modify(function(queryBuilder) {
        if (industryId) {
          queryBuilder.where('professional_profiles.industry_id', industryId);
        }
        
        if (minHourlyRate !== undefined) {
          queryBuilder.where('professional_profiles.hourly_rate', '>=', minHourlyRate);
        }
        
        if (maxHourlyRate !== undefined) {
          queryBuilder.where('professional_profiles.hourly_rate', '<=', maxHourlyRate);
        }
        
        if (minYearsExperience !== undefined) {
          queryBuilder.where('professional_profiles.years_experience', '>=', minYearsExperience);
        }
        
        if (isAvailable !== undefined) {
          queryBuilder.where('professional_profiles.is_available', isAvailable);
        } else {
          queryBuilder.where('professional_profiles.is_available', true);
        }
        
        if (expertise) {
          queryBuilder.whereRaw("professional_profiles.expertise_areas @> ?::text[]", [[expertise]]);
        }
        
        if (search) {
          queryBuilder.where(function() {
            this.where('professional_profiles.job_title', 'ilike', `%${search}%`)
              .orWhere('users.first_name', 'ilike', `%${search}%`)
              .orWhere('users.last_name', 'ilike', `%${search}%`)
              .orWhere('industries.name', 'ilike', `%${search}%`)
              .orWhere('companies.name', 'ilike', `%${search}%`);
          });
        }
      });
    
    return {
      profiles: anonymizedProfiles,
      pagination: {
        total: parseInt(count, 10),
        page,
        limit,
        pages: Math.ceil(parseInt(count, 10) / limit)
      }
    };
  }

  /**
   * Get availability for a professional
   * @param {string} id - Profile ID
   * @returns {Object} Availability object
   */
  static async getAvailability(id) {
    const profile = await db('professional_profiles')
      .where({ id })
      .select('availability')
      .first();
    
    if (!profile) {
      throw new NotFoundError('Professional profile not found');
    }
    
    return profile.availability ? JSON.parse(profile.availability) : {};
  }

  /**
   * Update availability for a professional
   * @param {string} id - Profile ID
   * @param {Object} availability - Availability data
   * @returns {Object} Updated availability
   */
  static async updateAvailability(id, availability) {
    // Check if profile exists
    const existingProfile = await this.findById(id);
    
    if (!existingProfile) {
      throw new NotFoundError('Professional profile not found');
    }
    
    // Update availability
    await db('professional_profiles')
      .where({ id })
      .update({
        availability: JSON.stringify(availability)
      });
    
    return availability;
  }

  /**
   * Update Zoom credentials for a professional
   * @param {string} id - Profile ID
   * @param {Object} credentials - Zoom credentials
   * @returns {Object} Updated profile
   */
  static async updateZoomCredentials(id, credentials) {
    // Check if profile exists
    const existingProfile = await this.findById(id);
    
    if (!existingProfile) {
      throw new NotFoundError('Professional profile not found');
    }
    
    // Update Zoom credentials
    const [updatedProfile] = await db('professional_profiles')
      .where({ id })
      .update({
        zoom_credentials: JSON.stringify(credentials)
      })
      .returning('*');
    
    // Parse JSON fields
    if (updatedProfile.availability) {
      updatedProfile.availability = JSON.parse(updatedProfile.availability);
    }
    
    if (updatedProfile.zoom_credentials) {
      updatedProfile.zoom_credentials = JSON.parse(updatedProfile.zoom_credentials);
    }
    
    return updatedProfile;
  }
}

module.exports = ProfessionalProfile;
