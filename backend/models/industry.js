const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const industrySchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: String,
  parentIndustry: {
    type: Schema.Types.ObjectId,
    ref: 'Industry'
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
industrySchema.index({ name: 1 });

const Industry = mongoose.model('Industry', industrySchema);

module.exports = Industry;