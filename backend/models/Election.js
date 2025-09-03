const mongoose = require('mongoose');
const crypto = require('crypto');

const ElectionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  facultyRestriction: {
    type: String,
    default: null
  },
  departmentRestrictions: {
    type: [String],
    default: []
  },
  candidates: [{
    name: String,
    votes: {
      type: Number,
      default: 0
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  votingLinkToken: {
    type: String,
    unique: true,
    sparse: true  // Critical fix: allows null values in unique index
  }
}, { timestamps: true });

// Generate voting link token before saving
ElectionSchema.pre('validate', function(next) {
  if (!this.votingLinkToken) {
    // Generate a unique token
    this.votingLinkToken = crypto.randomBytes(8).toString('hex');
  }
  next();
});

module.exports = mongoose.model('Election', ElectionSchema);
