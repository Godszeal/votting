const User = require('../models/User');
const Election = require('../models/Election');
const ErrorResponse = require('../middleware/errorResponse');
const asyncHandler = require('../middleware/async');
const { v4: uuidv4 } = require('uuid');

// @desc    Create new election
// @route   POST /api/admin/elections
// @access  Private/Admin
exports.createElection = asyncHandler(async (req, res, next) => {
  const { title, description, faculty, department, candidates, startDate, endDate } = req.body;
  
  // Validate required fields
  if (!title || !description || !faculty || !department || !startDate || !endDate || !candidates || candidates.length === 0) {
    return next(new ErrorResponse('Please provide all required fields', 400));
  }
  
  // Validate at least 2 candidates
  if (candidates.length < 2) {
    return next(new ErrorResponse('At least two candidates are required', 400));
  }
  
  // Validate dates
  if (new Date(endDate) <= new Date(startDate)) {
    return next(new ErrorResponse('End date must be after start date', 400));
  }
  
  // Generate unique vote link
  const voteLink = uuidv4();
  
  // Create election
  const election = await Election.create({
    title,
    description,
    faculty,
    department,
    candidates,
    startDate,
    endDate,
    createdBy: req.user.id,
    voteLink
  });
  
  res.status(201).json({
    success: true,
    data: election
  });
});

// @desc    Get all elections
// @route   GET /api/admin/elections
// @access  Private/Admin
exports.getAllElections = asyncHandler(async (req, res, next) => {
  const elections = await Election.find({}).sort('-createdAt');
  
  res.status(200).json({
    success: true,
    count: elections.length,
     elections
  });
});

// @desc    Get single election
// @route   GET /api/admin/elections/:id
// @access  Private/Admin
exports.getElection = asyncHandler(async (req, res, next) => {
  const election = await Election.findById(req.params.id);
  
  if (!election) {
    return next(new ErrorResponse(`Election not found with id of ${req.params.id}`, 404));
  }
  
  res.status(200).json({
    success: true,
     election
  });
});

// @desc    Update election
// @route   PUT /api/admin/elections/:id
// @access  Private/Admin
exports.updateElection = asyncHandler(async (req, res, next) => {
  let election = await Election.findById(req.params.id);
  
  if (!election) {
    return next(new ErrorResponse(`Election not found with id of ${req.params.id}`, 404));
  }
  
  // Validate dates if provided
  if (req.body.startDate && req.body.endDate) {
    if (new Date(req.body.endDate) <= new Date(req.body.startDate)) {
      return next(new ErrorResponse('End date must be after start date', 400));
    }
  }
  
  election = await Election.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  
  res.status(200).json({
    success: true,
     election
  });
});

// @desc    Delete election
// @route   DELETE /api/admin/elections/:id
// @access  Private/Admin
exports.deleteElection = asyncHandler(async (req, res, next) => {
  const election = await Election.findById(req.params.id);
  
  if (!election) {
    return next(new ErrorResponse(`Election not found with id of ${req.params.id}`, 404));
  }
  
  await election.remove();
  
  res.status(200).json({
    success: true,
     {}
  });
});

// @desc    End election early
// @route   POST /api/admin/elections/:id/end
// @access  Private/Admin
exports.endElection = asyncHandler(async (req, res, next) => {
  const election = await Election.findById(req.params.id);
  
  if (!election) {
    return next(new ErrorResponse(`Election not found with id of ${req.params.id}`, 404));
  }
  
  election.isActive = false;
  election.endDate = new Date();
  
  await election.save();
  
  res.status(200).json({
    success: true,
    data: election
  });
});

// @desc    Get election results
// @route   GET /api/admin/elections/:id/results
// @access  Private/Admin
exports.getElectionResults = asyncHandler(async (req, res, next) => {
  const election = await Election.findById(req.params.id);
  
  if (!election) {
    return next(new ErrorResponse(`Election not found with id of ${req.params.id}`, 404));
  }
  
  // Sort candidates by votes
  const results = [...election.candidates].sort((a, b) => b.votes - a.votes);
  
  res.status(200).json({
    success: true,
    data: {
      election: {
        _id: election._id,
        title: election.title,
        faculty: election.faculty,
        department: election.department
      },
      results
    }
  });
});

// @desc    Manage users
// @route   GET /api/admin/users
// @access  Private/Admin
exports.manageUsers = asyncHandler(async (req, res, next) => {
  const users = await User.find({}).select('-password').sort('-createdAt');
  
  res.status(200).json({
    success: true,
    count: users.length,
     users
  });
});

// @desc    Get user details
// @route   GET /api/admin/users/:id
// @access  Private/Admin
exports.getUserDetails = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id).select('-password');
  
  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
  }
  
  res.status(200).json({
    success: true,
     user
  });
});

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
exports.updateUserRole = asyncHandler(async (req, res, next) => {
  const { role } = req.body;
  
  const user = await User.findById(req.params.id);
  
  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
  }
  
  user.role = role;
  
  const updatedUser = await user.save();
  
  res.status(200).json({
    success: true,
    data: {
      _id: updatedUser._id,
      matricNumber: updatedUser.matricNumber,
      username: updatedUser.username,
      email: updatedUser.email,
      role: updatedUser.role
    }
  });
});
