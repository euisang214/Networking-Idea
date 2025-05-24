const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const sessionSchema = new Schema({
  professional: {
    type: Schema.Types.ObjectId,
    ref: 'ProfessionalProfile',
    required: true
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startTime: Date,
  endTime: Date,
  status: {
    type: String,
    enum: ['requested', 'scheduled', 'in-progress', 'completed', 'cancelled', 'no-show'],
    default: 'requested'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded', 'released'],
    default: 'pending'
  },
  paymentId: {
    type: String
  },
  price: {
    type: Number,
    required: true
  },
  zoomMeetingId: {
    type: String
  },
  zoomMeetingUrl: {
    type: String
  },
  zoomMeetingPassword: {
    type: String
  },
  zoomMeetingVerified: {
    type: Boolean,
    default: false
  },
  verificationDetails: {
    meetingDuration: Number,
    participantCount: Number,
    verifiedAt: Date
  },
  candidateAvailabilities: [
    {
      startTime: Date,
      endTime: Date,
    },
  ],
  notes: {
    type: String
  },
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    providedAt: Date
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
sessionSchema.index({ professional: 1, startTime: 1 });
sessionSchema.index({ user: 1, startTime: 1 });
sessionSchema.index({ zoomMeetingId: 1 });

// Virtuals
sessionSchema.virtual('duration').get(function() {
  if (!this.startTime || !this.endTime) return 0;
  return (this.endTime - this.startTime) / (1000 * 60); // Duration in minutes
});

// Methods
sessionSchema.methods.markAsVerified = function(duration, participantCount) {
  this.zoomMeetingVerified = true;
  this.status = 'completed';
  this.verificationDetails = {
    meetingDuration: duration,
    participantCount: participantCount,
    verifiedAt: new Date()
  };
  return this.save();
};

sessionSchema.methods.releasePayment = function() {
  if (this.zoomMeetingVerified && this.status === 'completed') {
    this.paymentStatus = 'released';
    return this.save();
  }
  throw new Error('Cannot release payment for unverified session');
};

const Session = mongoose.model('Session', sessionSchema);

module.exports = Session;