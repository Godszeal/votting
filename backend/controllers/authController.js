const User = require('../models/User');
const ErrorResponse = require('../middleware/errorResponse');
const asyncHandler = require('../middleware/async');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

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
    data: user
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
    // In production, send email with reset link
    // await sendEmail({
    //   email: user.email,
    //   subject: 'Password Reset Request',
    //   message: `You have requested a password reset. Please make a PUT request to: \n\n ${resetUrl}`
    // });

    // Return a proper JSON object. For development, include the token so you can test the flow.
    const responsePayload = { success: true, message: 'Reset token generated' };
    if (process.env.NODE_ENV !== 'production') {
      responsePayload.resetToken = resetToken;
      responsePayload.resetUrl = resetUrl;
    }

    res.status(200).json(responsePayload);
  } catch (err) {
    console.error(err);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new ErrorResponse('Email could not be sent', 500));
  }
});

// @desc    Reset password
// @route   PUT /api/auth/reset-password
// @access  Private
exports.resetPassword = asyncHandler(async (req, res, next) => {
  // Get password from request body
  const { password } = req.body;

  if (!password) {
    return next(new ErrorResponse('Please provide a new password', 400));
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Update user password
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { password: hashedPassword },
    { new: true, runValidators: true }
  );

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  sendTokenResponse(user, 200, res);
});

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
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
