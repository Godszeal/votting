const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  matricNumber: {
    type: String,
    required: true,
    unique: true
  },
  faculty: {
    type: String,
    required: true,
    enum: [
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
  department: {
    type: String,
    required: true,
    enum: [
      // Engineering
      'Computer Science',
      'Electrical Engineering',
      'Mechanical Engineering',
      'Civil Engineering',
      'Chemical Engineering',
      
      // Sciences
      'Physics',
      'Chemistry',
      'Mathematics',
      'Biology',
      'Geology',
      
      // Arts & Humanities
      'English',
      'History',
      'Philosophy',
      'Linguistics',
      'Theatre Arts',
      
      // Social Sciences
      'Economics',
      'Political Science',
      'Sociology',
      'Psychology',
      'Geography',
      
      // Medicine
      'Medicine',
      'Nursing',
      'Dentistry',
      'Pharmacy',
      'Public Health',
      
      // Law
      'Law',
      
      // Business Administration
      'Accounting',
      'Finance',
      'Marketing',
      'Management',
      'Human Resources',
      
      // Education
      'Primary Education',
      'Secondary Education',
      'Adult Education',
      'Special Education',
      'Curriculum Studies'
    ]
  },
  email: {
    type: String,
    required: false
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    default: 'user',
    enum: ['user', 'admin']
  },
  hasVoted: [{
    election: { type: mongoose.Schema.Types.ObjectId, ref: 'Election' }
  }],
  facultyToken: {
    type: String,
    default: null
  }
});

module.exports = mongoose.model('User', userSchema);
