const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const notificationSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'sessionCreated', 
      'sessionUpdated', 
      'sessionCancelled', 
      'sessionReminder',
      'paymentSuccess', 
      'paymentFailed', 
      'paymentReleased',
      'newMessage', 
      'messageRead',
      'newSession', 
      'sessionCompleted',
      'referralReceived', 
      'referralVerified', 
      'referralRewarded',
      'accountUpdate',
      'systemAlert',
      'feedbackSubmitted',
      'jobOfferReported', 
      'referralBonusPaid',
      'referralBonusProcessed'
    ],
    required: true
  },
  title: String,
  message: String,
  data: Schema.Types.Mixed,
  read: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Add index for faster lookups
notificationSchema.index({ user: 1, read: 1 });
notificationSchema.index({ user: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;