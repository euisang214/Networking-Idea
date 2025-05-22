const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const referralEventSchema = new Schema({
  referral: { type: Schema.Types.ObjectId, ref: 'Referral', index: true },
  type: { type: String, required: true },
  data: Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const ReferralEvent = mongoose.model('ReferralEvent', referralEventSchema);

module.exports = ReferralEvent;
