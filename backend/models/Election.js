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
    required: true,
    unique: true,
    default: function() {
      return crypto.randomBytes(8).toString('hex');
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save hook to generate unique token if not provided
ElectionSchema.pre('save', async function(next) {
  // Only generate token if it's a new document or token is not set
  if (this.isNew || !this.votingLinkToken) {
    let token;
    let isUnique = false;
    
    // Keep generating tokens until we get a unique one
    while (!isUnique) {
      token = crypto.randomBytes(8).toString('hex');
      
      // Check if token already exists
      const existingElection = await this.constructor.findOne({ votingLinkToken: token });
      isUnique = !existingElection;
    }
    
    this.votingLinkToken = token;
  }
  
  next();
});

module.exports = mongoose.model('Election', ElectionSchema);
