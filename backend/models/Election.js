const mongoose = require('mongoose');
const crypto = require('crypto');

// Generate a unique voting link token
const generateVotingLinkToken = () => {
  return crypto.randomBytes(8).toString('hex');
};

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
  candidates: [
    {
      name: {
        type: String,
        required: true
      },
      votes: {
        type: Number,
        default: 0
      }
    }
  ],
  votingLinkToken: {
    type: String,
    required: true,
    unique: true,
    default: generateVotingLinkToken
  },
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
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

// Pre-save hook to ensure votingLinkToken is generated if not provided
ElectionSchema.pre('save', function(next) {
  if (!this.votingLinkToken) {
    this.votingLinkToken = generateVotingLinkToken();
  }
  next();
});

// Index for faster queries
ElectionSchema.index({ votingLinkToken: 1 }, { unique: true });

module.exports = mongoose.model('Election', ElectionSchema);
