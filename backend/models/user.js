const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  userType: {
    type: String,
    enum: ['candidate', 'professional', 'admin'],
    default: 'candidate'
  },
  profileImage: {
    type: String
  },
  // Optional resume file stored as a Base64 data URL or external link
  resume: {
    type: String
  },
  phoneNumber: {
    type: String
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  stripeCustomerId: String,
  settings: {
    notifications: {
      email: {
        sessionReminders: { type: Boolean, default: true },
        paymentReceipts: { type: Boolean, default: true },
        newMessages: { type: Boolean, default: true },
        referralUpdates: { type: Boolean, default: true }
      },
      push: {
        sessionReminders: { type: Boolean, default: true },
        paymentReceipts: { type: Boolean, default: true },
        newMessages: { type: Boolean, default: true },
        referralUpdates: { type: Boolean, default: true }
      }
    },
    timezone: { type: String, default: 'UTC' },
    language: { type: String, default: 'en' }
  },
  lastLogin: Date,
  isActive: {
    type: Boolean,
    default: true
  },
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
userSchema.index({ email: 1 });
userSchema.index({ userType: 1 });

// Password hashing middleware
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Methods
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateEmailVerificationToken = function() {
  this.emailVerificationToken = crypto.randomBytes(32).toString('hex');
  return this.save();
};

userSchema.methods.generatePasswordResetToken = function() {
  this.passwordResetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetExpires = Date.now() + 3600000; // 1 hour
  return this.save();
};

// Helper static methods
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.findCandidateInEmailContent = async function(emailContent) {
  // This is a simple implementation - in production, you'd want more sophisticated
  // email parsing to extract candidate information from the email body
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
  const matches = emailContent.match(emailRegex);
  
  if (!matches) return null;
  
  // Try to find any of the extracted emails in the database
  for (const email of matches) {
    const user = await this.findOne({ 
      email: email.toLowerCase(),
      userType: 'candidate'
    });
    if (user) return user;
  }
  
  return null;
};

const User = mongoose.model('User', userSchema);

module.exports = User;