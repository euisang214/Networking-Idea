/**
 * User model
 */
const db = require('../db');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

class User {
  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Object} Created user object
   */
  static async create(userData) {
    // Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(userData.password, saltRounds);
    
    // Generate a UUID if not provided
    const id = userData.id || uuidv4();
    
    // Insert the user into the database
    const [user] = await db('users')
      .insert({
        id,
        email: userData.email.toLowerCase(),
        password_hash: passwordHash,
        first_name: userData.first_name,
        last_name: userData.last_name,
        role: userData.role || 'seeker',
        is_verified: userData.is_verified || false,
        is_anonymized: userData.is_anonymized || false,
        bio: userData.bio || null,
        profile_picture: userData.profile_picture || null,
        linkedin_url: userData.linkedin_url || null
      })
      .returning('*');
    
    // Don't return the password hash
    delete user.password_hash;
    
    return user;
  }

  /**
   * Find a user by ID
   * @param {string} id - User ID
   * @returns {Object|null} User object or null if not found
   */
  static async findById(id) {
    const user = await db('users')
      .where({ id })
      .first();
    
    return user || null;
  }

  /**
   * Find a user by email
   * @param {string} email - User email
   * @returns {Object|null} User object or null if not found
   */
  static async findByEmail(email) {
    const user = await db('users')
      .where({ email: email.toLowerCase() })
      .first();
    
    return user || null;
  }

  /**
   * Update a user
   * @param {string} id - User ID
   * @param {Object} userData - User data to update
   * @returns {Object} Updated user object
   */
  static async update(id, userData) {
    // Create update object
    const updateData = {};
    
    // Only include fields that are provided
    if (userData.email) updateData.email = userData.email.toLowerCase();
    if (userData.first_name) updateData.first_name = userData.first_name;
    if (userData.last_name) updateData.last_name = userData.last_name;
    if (userData.role) updateData.role = userData.role;
    if (userData.is_verified !== undefined) updateData.is_verified = userData.is_verified;
    if (userData.is_anonymized !== undefined) updateData.is_anonymized = userData.is_anonymized;
    if (userData.bio !== undefined) updateData.bio = userData.bio;
    if (userData.profile_picture !== undefined) updateData.profile_picture = userData.profile_picture;
    if (userData.linkedin_url !== undefined) updateData.linkedin_url = userData.linkedin_url;
    
    // Handle password update separately
    if (userData.password) {
      const saltRounds = 10;
      updateData.password_hash = await bcrypt.hash(userData.password, saltRounds);
    }
    
    // Update the user
    const [updatedUser] = await db('users')
      .where({ id })
      .update(updateData)
      .returning('*');
    
    // Don't return the password hash
    delete updatedUser.password_hash;
    
    return updatedUser;
  }

  /**
   * Delete a user
   * @param {string} id - User ID
   * @returns {boolean} True if deleted, false if not found
   */
  static async delete(id) {
    const count = await db('users')
      .where({ id })
      .delete();
    
    return count > 0;
  }

  /**
   * List users with pagination
   * @param {Object} options - Pagination and filter options
   * @returns {Array} Array of user objects
   */
  static async list({ page = 1, limit = 20, role, isVerified, isAnonymized, search }) {
    const query = db('users').select(
      'id',
      'email',
      'first_name',
      'last_name',
      'role',
      'is_verified',
      'is_anonymized',
      'bio',
      'profile_picture',
      'linkedin_url',
      'created_at',
      'updated_at'
    );
    
    // Apply filters
    if (role) {
      query.where({ role });
    }
    
    if (isVerified !== undefined) {
      query.where({ is_verified: isVerified });
    }
    
    if (isAnonymized !== undefined) {
      query.where({ is_anonymized: isAnonymized });
    }
    
    // Apply search
    if (search) {
      query.where(function() {
        this.where('email', 'ilike', `%${search}%`)
          .orWhere('first_name', 'ilike', `%${search}%`)
          .orWhere('last_name', 'ilike', `%${search}%`);
      });
    }
    
    // Apply pagination
    const offset = (page - 1) * limit;
    query.offset(offset).limit(limit);
    
    // Execute query
    const users = await query;
    
    // Get total count for pagination
    const [{ count }] = await db('users')
      .count('id')
      .modify(function(queryBuilder) {
        if (role) {
          queryBuilder.where({ role });
        }
        
        if (isVerified !== undefined) {
          queryBuilder.where({ is_verified: isVerified });
        }
        
        if (isAnonymized !== undefined) {
          queryBuilder.where({ is_anonymized: isAnonymized });
        }
        
        if (search) {
          queryBuilder.where(function() {
            this.where('email', 'ilike', `%${search}%`)
              .orWhere('first_name', 'ilike', `%${search}%`)
              .orWhere('last_name', 'ilike', `%${search}%`);
          });
        }
      });
    
    return {
      users,
      pagination: {
        total: parseInt(count, 10),
        page,
        limit,
        pages: Math.ceil(parseInt(count, 10) / limit)
      }
    };
  }

  /**
   * Change a user's password
   * @param {string} id - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {boolean} True if password changed, false if current password is incorrect
   */
  static async changePassword(id, currentPassword, newPassword) {
    // Get the user with password hash
    const user = await db('users')
      .where({ id })
      .first();
    
    if (!user) {
      return false;
    }
    
    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    
    if (!isMatch) {
      return false;
    }
    
    // Hash the new password
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);
    
    // Update the password
    await db('users')
      .where({ id })
      .update({ password_hash: newPasswordHash });
    
    return true;
  }

  /**
   * Verify a user
   * @param {string} id - User ID
   * @returns {Object} Updated user object
   */
  static async verify(id) {
    const [user] = await db('users')
      .where({ id })
      .update({ is_verified: true })
      .returning('*');
    
    // Don't return the password hash
    delete user.password_hash;
    
    return user;
  }

  /**
   * Anonymize a user
   * @param {string} id - User ID
   * @param {boolean} anonymize - Whether to anonymize (true) or de-anonymize (false)
   * @returns {Object} Updated user object
   */
  static async setAnonymization(id, anonymize = true) {
    const [user] = await db('users')
      .where({ id })
      .update({ is_anonymized: anonymize })
      .returning('*');
    
    // Don't return the password hash
    delete user.password_hash;
    
    return user;
  }
}

module.exports = User;
