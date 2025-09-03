const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  votes: { type: Number, default: 0 }
});

const electionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  candidates: [candidateSchema],
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  
  // Faculty/Department restrictions
  facultyRestriction: { 
    type: String, 
    default: null,
    enum: [
      null,
      'Faculty Of Computing and Informatics',
      'Engineering',
      'Sciences',
      'Arts & Humanities',
      'Social Sciences',
      'Medicine',
      'Law',
      'Business Administration',
      'Education'
    ]
  },
  departmentRestrictions: { 
    type: [String],
    default: []
  },
  
  // Unique voting link
  votingLinkToken: {
    type: String,
    required: true,
    unique: true,
    default: function() {
      return Math.random().toString(36).substr(2, 15);
    }
  }
});

module.exports = mongoose.model('Election', electionSchema);
