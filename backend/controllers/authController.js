const User = require('../models/User');
const ErrorResponse = require('../middleware/errorResponse');
const asyncHandler = require('../middleware/async');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const sendEmail = require('../utils/email');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  const { matricNumber, username, email, password, department, faculty } = req.body;

  // Validate matric number (must be exactly 10 digits)
  if (!/^\d{10}$/.test(matricNumber)) {
    return next(new ErrorResponse('Matric number must be exactly 10 digits', 400));
  }

  // Check if user exists
  const existingUser = await User.findOne({ 
    $or: [
      { matricNumber }, 
      { email }, 
      { username }
    ] 
  });

  if (existingUser) {
    const field = matricNumber === existingUser.matricNumber ? 'matricNumber' :
                 email === existingUser.email ? 'email' : 'username';
    return next(new ErrorResponse(`User with this ${field} already exists`, 400));
  }

  // Create user
  const user = await User.create({
    matricNumber,
    username,
    email,
    password,
    department,
    faculty
  });

  sendTokenResponse(user, 201, res);
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { matricNumber, password } = req.body;

  // Validate matric number
  if (!/^\d{10}$/.test(matricNumber)) {
    return next(new ErrorResponse('Matric number must be exactly 10 digits', 400));
  }

  // Check for user
  const user = await User.findOne({ matricNumber }).select('+password');

  if (!user) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Check password
  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  sendTokenResponse(user, 200, res);
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('-password');
  
  res.status(200).json({
    success: true,
    user
  });
});

// @desc    Logout user / clear cookie
// @route   GET /api/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res, next) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const { matricNumber, username } = req.body;

  const user = await User.findOne({ matricNumber, username });

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  // Generate reset token
  const resetToken = user.getResetPasswordToken();

  await user.save({ validateBeforeSave: false });

  // Create reset URL
  const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Password Reset Request',
      message: `You have requested a password reset. Please make a PUT request to: \n\n ${resetUrl}`
    });

    res.status(200).json({ success: true, message: 'Reset token sent to email' });
  } catch (err) {
    console.error(err);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new ErrorResponse('Email could not be sent', 500));
  }
});

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:resettoken
// @access  Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  // Get hashed token
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resettoken)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) {
    return next(new ErrorResponse('Invalid token', 400));
  }

  // Set new password
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  sendTokenResponse(user, 200, res);
});

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(Date.now() + (parseInt(process.env.JWT_COOKIE_EXPIRE) || 30) * 24 * 60 * 60 * 1000),
    httpOnly: true
  };

  // Secure cookies in production
  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      user: {
        id: user._id,
        matricNumber: user.matricNumber,
        username: user.username,
        email: user.email,
        role: user.role,
        faculty: user.faculty,
        department: user.department,
        avatar: user.avatar
      }
    });
};
