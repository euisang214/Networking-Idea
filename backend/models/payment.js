const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const paymentSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'usd'
  },
  description: String,
  type: {
    type: String,
    enum: ['session', 'referral', 'subscription', 'payout'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'bank_account', 'paypal']
  },
  paymentMethodDetails: {
    brand: String,
    last4: String,
    expiryMonth: Number,
    expiryYear: Number
  },
  stripePaymentId: String,
  stripeTransferId: String,
  stripeRefundId: String,
  receiptUrl: String,
  session: {
    type: Schema.Types.ObjectId,
    ref: 'Session',
    unique: true,
    sparse: true
  },
  referral: {
    type: Schema.Types.ObjectId,
    ref: 'Referral',
    unique: true,
    sparse: true
  },
  platformFee: {
    amount: Number,
    percentage: Number
  },
  metadata: Schema.Types.Mixed,
  createdAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  failedReason: String
}, {
  timestamps: true
});

// Add index for faster lookups
paymentSchema.index({ user: 1 });
paymentSchema.index({ recipient: 1 });
paymentSchema.index({ session: 1 }, { unique: true, sparse: true });
paymentSchema.index({ referral: 1 }, { unique: true, sparse: true });
paymentSchema.index({ stripePaymentId: 1 });
paymentSchema.index({ status: 1 });

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;