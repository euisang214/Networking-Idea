const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const jobOfferSchema = new Schema({
  candidate: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  professional: {
    type: Schema.Types.ObjectId,
    ref: 'ProfessionalProfile',
    required: true
  },
  company: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  session: {
    type: Schema.Types.ObjectId,
    ref: 'Session',
    required: true
  },
  // Who reported the offer
  reportedBy: {
    type: String,
    enum: ['candidate', 'professional'],
    required: true
  },
  // Confirmation from the other party
  confirmedBy: {
    type: String,
    enum: ['candidate', 'professional']
  },
  status: {
    type: String,
    enum: ['reported', 'confirmed', 'paid'],
    default: 'reported'
  },
  offerDetails: {
    position: String,
    startDate: Date,
    salary: Number
  },
  bonusAmount: {
    type: Number,
    required: true
  },
  paymentId: String,
  paidAt: Date,
  reportedAt: {
    type: Date,
    default: Date.now
  },
  confirmedAt: Date
}, {
  timestamps: true
});

// Indexes
jobOfferSchema.index({ candidate: 1, company: 1 });
jobOfferSchema.index({ professional: 1 });
jobOfferSchema.index({ status: 1 });

module.exports = mongoose.model('JobOffer', jobOfferSchema);