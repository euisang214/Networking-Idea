const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const professionalProfileSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  company: {
    type: Schema.Types.ObjectId,
    ref: 'Company'
  },
  companyName: String,
  industry: {
    type: Schema.Types.ObjectId,
    ref: 'Industry'
  },
  yearsOfExperience: {
    type: Number,
    required: true
  },
  skills: [{
    type: String
  }],
  bio: {
    type: String
  },
  hourlyRate: {
    type: Number,
    required: true
  },
  availability: [{
    day: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    },
    startTime: String, // HH:MM format
    endTime: String // HH:MM format
  }],
  education: [{
    institution: String,
    degree: String,
    fieldOfStudy: String,
    from: Date,
    to: Date,
    current: Boolean,
    description: String
  }],
  certifications: [{
    name: String,
    issuer: String,
    dateObtained: Date,
    expiryDate: Date,
    credentialId: String,
    credentialUrl: String
  }],
  languages: [{
    language: String,
    proficiency: {
      type: String,
      enum: ['basic', 'conversational', 'fluent', 'native']
    }
  }],
  anonymizedProfile: {
    displayName: String,
    anonymizedCompany: String,
    anonymizedTitle: String,
    anonymizedBio: String
  },
  stripeConnectedAccountId: String,
  payoutSettings: {
    defaultMethod: {
      type: String,
      enum: ['bank_account', 'card', 'paypal'],
      default: 'bank_account'
    },
    autoPayoutThreshold: {
      type: Number,
      default: 100
    },
    payoutSchedule: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      default: 'weekly'
    }
  },
  sessionSettings: {
    defaultSessionLength: {
      type: Number,
      default: 30 // minutes
    },
    minSessionLength: {
      type: Number,
      default: 15 // minutes
    },
    maxSessionLength: {
      type: Number,
      default: 60 // minutes
    },
    bufferBetweenSessions: {
      type: Number,
      default: 15 // minutes
    },
    maxSessionsPerDay: {
      type: Number,
      default: 5
    }
  },
  statistics: {
    totalSessions: {
      type: Number,
      default: 0
    },
    completedSessions: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0
    },
    totalEarnings: {
      type: Number,
      default: 0
    },
    successfulReferrals: {
      type: Number,
      default: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationDate: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Add index for faster lookups
professionalProfileSchema.index({ user: 1 });
professionalProfileSchema.index({ industry: 1 });
professionalProfileSchema.index({ skills: 1 });
professionalProfileSchema.index({ isActive: 1, isVerified: 1 });

// Methods
professionalProfileSchema.methods.anonymize = function() {
  // Generate anonymized information to protect professional's identity
  const companyTypes = ['Fortune 500', 'Startup', 'Mid-size Company', 'Tech Giant', 'Enterprise'];
  const titleLevels = ['Junior', 'Senior', 'Lead', 'Staff', 'Principal'];
  
  this.anonymizedProfile = {
    displayName: `Professional with ${this.yearsOfExperience} years of experience`,
    anonymizedCompany: `${companyTypes[Math.floor(Math.random() * companyTypes.length)]} in ${this.industry.name}`,
    anonymizedTitle: `${titleLevels[Math.floor(Math.random() * titleLevels.length)]} ${this.title}`,
    anonymizedBio: this.bio.replace(/\b(I|my|our|we|us|myself|ourselves)\b/gi, 'they')
                      .replace(/\b(company|employer|organization)\b/gi, 'company')
  };
  
  return this.save();
};

professionalProfileSchema.methods.updateStatistics = async function() {
  const Session = mongoose.model('Session');
  const Referral = mongoose.model('Referral');
  
  // Update session statistics
  const sessions = await Session.find({ professional: this._id });
  const completedSessions = sessions.filter(session => session.status === 'completed');
  const ratings = completedSessions.filter(session => session.feedback && session.feedback.rating)
                                .map(session => session.feedback.rating);
  
  const avgRating = ratings.length > 0 
                    ? ratings.reduce((a, b) => a + b, 0) / ratings.length
                    : 0;
                    
  // Update earnings
  const totalEarnings = completedSessions.reduce((sum, session) => sum + (session.price || 0), 0);
  
  // Update referrals
  const successfulReferrals = await Referral.countDocuments({ 
    professional: this._id,
    status: 'rewarded'
  });
  
  this.statistics = {
    totalSessions: sessions.length,
    completedSessions: completedSessions.length,
    averageRating: avgRating,
    totalEarnings: totalEarnings,
    successfulReferrals: successfulReferrals
  };
  
  return this.save();
};

const ProfessionalProfile = mongoose.model('ProfessionalProfile', professionalProfileSchema);

module.exports = ProfessionalProfile;