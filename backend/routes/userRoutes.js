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

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
router.get('/profile', protect, getProfile);

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
router.put('/profile', protect, updateProfile);

// @desc    Change password
// @route   PUT /api/users/change-password
// @access  Private
router.put('/change-password', protect, changePassword);

// @desc    Get available elections for user
// @route   GET /api/users/elections
// @access  Private
router.get('/elections', protect, getAvailableElections);

// @desc    Cast a vote
// @route   POST /api/users/vote
// @access  Private
router.post('/vote', protect, castVote);

// @desc    Get voting history
// @route   GET /api/users/voting-history
// @access  Private
router.get('/voting-history', protect, getVotingHistory);

module.exports = router;
