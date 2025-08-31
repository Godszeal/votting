const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getProfile,
  updateProfile,
  changePassword,
  getAvailableElections,
  castVote,
  getVotingHistory
} = require('../controllers/userController');

// Verify controller functions exist
console.log('User controller functions available:', {
  getProfile: typeof getProfile === 'function',
  updateProfile: typeof updateProfile === 'function',
  changePassword: typeof changePassword === 'function',
  getAvailableElections: typeof getAvailableElections === 'function',
  castVote: typeof castVote === 'function',
  getVotingHistory: typeof getVotingHistory === 'function'
});

// Helper function to safely define routes
const safeRoute = (method, path, ...middlewares) => {
  // Remove any undefined middleware functions
  const validMiddlewares = middlewares.filter(mw => typeof mw === 'function');
  
  if (validMiddlewares.length === 0) {
    console.error(`No valid middleware functions for ${method.toUpperCase()} ${path}`);
    return;
  }
  
  // Define the route with the valid middleware chain
  router[method](path, ...validMiddlewares);
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
safeRoute('get', '/profile', protect, getProfile);

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
safeRoute('put', '/profile', protect, updateProfile);

// @desc    Change password
// @route   PUT /api/users/change-password
// @access  Private
safeRoute('put', '/change-password', protect, changePassword);

// @desc    Get available elections for user
// @route   GET /api/users/elections
// @access  Private
safeRoute('get', '/elections', protect, getAvailableElections);

// @desc    Cast a vote
// @route   POST /api/users/vote
// @access  Private
safeRoute('post', '/vote', protect, castVote);

// @desc    Get voting history
// @route   GET /api/users/voting-history
// @access  Private
safeRoute('get', '/voting-history', protect, getVotingHistory);

// Verify router is valid before exporting
console.log('User routes initialized with', router.stack.length, 'routes');

// Ensure we're always exporting a valid router
module.exports = router;
