const ProfessionalProfile = require('../models/professionalProfile');
const User = require('../models/user');
const Company = require('../models/company');
const Industry = require('../models/industry');
const logger = require('../utils/logger');

class ProfessionalService {
  // Create professional profile
  async createProfile(userId, profileData) {
    try {
      // Check if user exists
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      // Check if user is a professional
      if (user.userType !== 'professional') {
        throw new Error('User is not a professional');
      }
      
      // Check if profile already exists
      const existingProfile = await ProfessionalProfile.findOne({ user: userId });
      if (existingProfile) {
        throw new Error('Professional profile already exists');
      }
      
      // Handle company
      let companyId = profileData.company;
      if (profileData.companyName && !companyId) {
        // Try to find existing company
        let company = await Company.findOne({ 
          name: { $regex: new RegExp(`^${profileData.companyName}$`, 'i') }
        });
        
        if (!company) {
          // Create new company
          company = new Company({
            name: profileData.companyName,
            industry: profileData.industry
          });
          await company.save();
        }
        
        companyId = company._id;
      }
      
      // Create profile
      const profile = new ProfessionalProfile({
        user: userId,
        title: profileData.title,
        company: companyId,
        companyName: profileData.companyName,
        industry: profileData.industry,
        yearsOfExperience: profileData.yearsOfExperience,
        skills: profileData.skills || [],
        bio: profileData.bio,
        hourlyRate: profileData.hourlyRate,
        availability: profileData.availability || [],
        education: profileData.education || [],
        certifications: profileData.certifications || [],
        languages: profileData.languages || []
      });
      

      
      await profile.save();
      
      // Update user type if needed
      if (user.userType !== 'professional') {
        user.userType = 'professional';
        await user.save();
      }
      
      logger.info(`Professional profile created for user ${userId}`);
      
      return profile;
    } catch (error) {
      logger.error(`Failed to create professional profile: ${error.message}`);
      throw new Error(`Failed to create professional profile: ${error.message}`);
    }
  }

  // Get professional profile by ID
  async getProfileById(profileId, showPrivate = false) {
    try {
      const profile = await ProfessionalProfile.findById(profileId)
                                             .populate('user', showPrivate ? '-password' : 'firstName lastName')
                                             .populate('company')
                                             .populate('industry');
      
      if (!profile) {
        throw new Error('Professional profile not found');
      }
      
      return profile;
    } catch (error) {
      logger.error(`Failed to get professional profile: ${error.message}`);
      throw new Error(`Failed to get professional profile: ${error.message}`);
    }
  }

  // Get professional profile by user ID
  async getProfileByUserId(userId, showPrivate = false) {
    try {
      const profile = await ProfessionalProfile.findOne({ user: userId })
                                             .populate('user', showPrivate ? '-password' : 'firstName lastName')
                                             .populate('company')
                                             .populate('industry');
      
      if (!profile) {
        throw new Error('Professional profile not found');
      }
      
      return profile;
    } catch (error) {
      logger.error(`Failed to get professional profile by user ID: ${error.message}`);
      throw new Error(`Failed to get professional profile by user ID: ${error.message}`);
    }
  }

  // Update professional profile
  async updateProfile(profileId, userId, updateData) {
    try {
      const profile = await ProfessionalProfile.findById(profileId);
      
      if (!profile) {
        throw new Error('Professional profile not found');
      }
      
      // Verify user owns the profile
      if (profile.user.toString() !== userId) {
        throw new Error('Unauthorized to update this profile');
      }
      
      // Update fields
      const allowedFields = [
        'title', 'bio', 'skills', 'hourlyRate', 'availability', 
        'education', 'certifications', 'languages', 'sessionSettings'
      ];
      
      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          profile[field] = updateData[field];
        }
      });
      
      // Handle company change if provided
      if (updateData.company || updateData.companyName) {
        if (updateData.company) {
          profile.company = updateData.company;
          
          const company = await Company.findById(updateData.company);
          if (company) {
            profile.companyName = company.name;
          }
        } else if (updateData.companyName) {
          profile.companyName = updateData.companyName;
          
          // Try to find or create company
          let company = await Company.findOne({ 
            name: { $regex: new RegExp(`^${updateData.companyName}$`, 'i') }
          });
          
          if (!company && updateData.industry) {
            company = new Company({
              name: updateData.companyName,
              industry: updateData.industry
            });
            await company.save();
            
            profile.company = company._id;
          }
        }
      }
      
      // Handle industry change
      if (updateData.industry) {
        profile.industry = updateData.industry;
      }
      

      
      await profile.save();
      
      logger.info(`Professional profile ${profileId} updated by user ${userId}`);
      
      return profile;
    } catch (error) {
      logger.error(`Failed to update professional profile: ${error.message}`);
      throw new Error(`Failed to update professional profile: ${error.message}`);
    }
  }

  // Search for professionals with filters
  async searchProfessionals(filters = {}, limit = 20, offset = 0) {
    try {
      const query = {
        isActive: true,
        isVerified: true
      };
      
      // Add filters
      if (filters.industry) {
        query.industry = filters.industry;
      }
      
      if (filters.skills && filters.skills.length > 0) {
        query.skills = { $in: filters.skills };
      }
      
      if (filters.minExperience) {
        query.yearsOfExperience = { $gte: parseInt(filters.minExperience, 10) };
      }
      
      if (filters.maxRate) {
        query.hourlyRate = { $lte: parseInt(filters.maxRate, 10) };
      }
      
      // Execute query
      const professionals = await ProfessionalProfile.find(query)
                                                  .populate('industry')
                                                  .populate('company')
                                                  .populate('user', 'firstName lastName')
                                                  .sort({ yearsOfExperience: -1 })
                                                  .skip(offset)
                                                  .limit(limit)
                                                  .exec();
      
      const total = await ProfessionalProfile.countDocuments(query);
      
      return {
        professionals,
        total,
        page: Math.floor(offset / limit) + 1,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      logger.error(`Failed to search professionals: ${error.message}`);
      throw new Error(`Failed to search professionals: ${error.message}`);
    }
  }

  // Get all available industries
  async getIndustries() {
    try {
      return await Industry.find().sort({ name: 1 }).exec();
    } catch (error) {
      logger.error(`Failed to get industries: ${error.message}`);
      throw new Error(`Failed to get industries: ${error.message}`);
    }
  }

}

module.exports = new ProfessionalService();