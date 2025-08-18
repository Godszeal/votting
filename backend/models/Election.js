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
  
  // New restriction fields
  universityRestriction: { 
    type: String, 
    default: null,
    enum: [
      null, 
      'All Universities', 
      'University of Lagos', 
      'Covenant University',
      'University of Ibadan',
      'Obafemi Awolowo University',
      'University of Benin',
      'Ahmadu Bello University'
    ]
  },
  departmentRestriction: { 
    type: String, 
    default: null,
    enum: [
      null,
      'All Departments',
      'Computer Science',
      'Electrical Engineering',
      'Mechanical Engineering',
      'Medicine',
      'Law',
      'Business Administration',
      'Economics',
      'Political Science'
    ]
  }
});

module.exports = mongoose.model('Election', electionSchema);
