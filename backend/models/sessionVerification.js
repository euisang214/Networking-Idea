const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const sessionVerificationSchema = new Schema({
  session: { type: Schema.Types.ObjectId, ref: 'Session', required: true, index: true },
  verified: { type: Boolean, required: true },
  method: { type: String, default: 'zoom-webhook' },
  meetingDuration: Number,
  participantCount: Number,
  reason: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const SessionVerification = mongoose.model('SessionVerification', sessionVerificationSchema);

module.exports = SessionVerification;
