const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const referralSchema = new Schema({
  professional: {
    type: Schema.Types.ObjectId,
    ref: 'ProfessionalProfile',
    required: true
  },
  candidate: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  referralType: {
    type: String,
    enum: ['email', 'link', 'other'],
    default: 'email'
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'rejected', 'rewarded'],
    default: 'pending'
  },
  emailDetails: {
    senderEmail: String,
    senderDomain: String,
    recipientEmail: String,
    recipientDomain: String,
    referralEmailId: String,
    ccEmails: [String],
    subject: String,
    timestamp: Date
  },
  emailDomainVerified: {
    type: Boolean,
    default: false
  },
  verificationDetails: {
    verifiedAt: Date,
    verificationMethod: String,
    verifiedBy: Schema.Types.ObjectId
  },
  rewardAmount: {
    type: Number,
    default: 0
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'processing', 'paid', 'failed'],
    default: 'pending'
  },
  paymentId: String,
  payoutDate: Date,
  notes: String,
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
referralSchema.index({ professional: 1, createdAt: -1 });
referralSchema.index({ candidate: 1 });
referralSchema.index({ 'emailDetails.referralEmailId': 1 });
referralSchema.index({ status: 1, emailDomainVerified: 1 });
referralSchema.index({ professional: 1, status: 1, payoutDate: -1 });

// Methods

const Referral = mongoose.model('Referral', referralSchema);

module.exports = Referral;