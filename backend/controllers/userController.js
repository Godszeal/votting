const User = require('../models/User');
const Election = require('../models/Election');
const ErrorResponse = require('../middleware/errorResponse');
const asyncHandler = require('../middleware/async');
const bcrypt = require('bcryptjs');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
exports.getProfile = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('-password');
  
  res.status(200).json({
    success: true,
     user
  });
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = asyncHandler(async (req, res, next) => {
  const { username, email, department, faculty } = req.body;
  
  const user = await User.findById(req.user.id);
  
  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }
  
  // Update fields
  user.username = username || user.username;
  user.email = email || user.email;
  user.department = department || user.department;
  user.faculty = faculty || user.faculty;
  
  const updatedUser = await user.save();
  
  res.status(200).json({
    success: true,
     {
      _id: updatedUser._id,
      matricNumber: updatedUser.matricNumber,
      username: updatedUser.username,
      email: updatedUser.email,
      department: updatedUser.department,
      faculty: updatedUser.faculty,
      avatar: updatedUser.avatar
    }
  });
});

// @desc    Change password
// @route   PUT /api/users/change-password
// @access  Private
exports.changePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  
  const user = await User.findById(req.user.id).select('+password');
  
  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }
  
  // Check current password
  if (!(await user.matchPassword(currentPassword))) {
    return next(new ErrorResponse('Current password is incorrect', 401));
  }
  
  user.password = newPassword;
  await user.save();
  
  res.status(200).json({
    success: true,
    message: 'Password updated successfully'
  });
});

// @desc    Get available elections for user
// @route   GET /api/users/elections
// @access  Private
exports.getAvailableElections = asyncHandler(async (req, res, next) => {
  const now = new Date();
  
  // Find elections that are active, match user's faculty/department, and user hasn't voted in
  const elections = await Election.find({
    faculty: req.user.faculty,
    department: { $in: [req.user.department, 'All Departments'] },
    startDate: { $lte: now },
    endDate: { $gte: now },
    isActive: true
  }).sort('-createdAt');
  
  res.status(200).json({
    success: true,
     elections
  });
});

// @desc    Cast a vote
// @route   POST /api/users/vote
// @access  Private
exports.castVote = asyncHandler(async (req, res, next) => {
  const { electionId, candidateId } = req.body;
  
  // Check if user has already voted in this election
  const user = await User.findById(req.user.id);
  if (user.votedElections.includes(electionId)) {
    return next(new ErrorResponse('You have already voted in this election', 400));
  }
  
  // Find the election
  const election = await Election.findById(electionId);
  if (!election) {
    return next(new ErrorResponse('Election not found', 404));
  }
  
  // Check if election is still active
  const now = new Date();
  if (now < election.startDate || now > election.endDate || !election.isActive) {
    return next(new ErrorResponse('Election is not currently active', 400));
  }
  
  // Find the candidate
  const candidate = election.candidates.id(candidateId);
  if (!candidate) {
    return next(new ErrorResponse('Candidate not found', 404));
  }
  
  // Increment vote count
  candidate.votes += 1;
  
  // Mark user as having voted in this election
  user.votedElections.push(electionId);
  
  // Save changes
  await election.save();
  await user.save();
  
  res.status(200).json({
    success: true,
    message: 'Vote cast successfully'
  });
});

// @desc    Get voting history
// @route   GET /api/users/voting-history
// @access  Private
exports.getVotingHistory = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).populate('votedElections', 'title faculty department startDate endDate');
  
  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }
  
  res.status(200).json({
    success: true,
     user.votedElections
  });
});
