const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const companySchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  industry: {
    type: Schema.Types.ObjectId,
    ref: 'Industry'
  },
  website: String,
  size: {
    type: String,
    enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5000+']
  },
  founded: Number,
  headquarters: String,
  logo: String,
  description: String,
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
companySchema.index({ name: 1 });
companySchema.index({ industry: 1 });

const Company = mongoose.model('Company', companySchema);

module.exports = Company;