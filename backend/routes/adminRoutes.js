const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const {
  createElection,
  getAllElections,
  getElection,
  updateElection,
  deleteElection,
  endElection,
  getElectionResults,
  manageUsers,
  getUserDetails,
  updateUserRole
} = require('../controllers/adminController');

// @desc    Create new election
// @route   POST /api/admin/elections
// @access  Private/Admin
router.post('/elections', protect, admin, createElection);

// @desc    Get all elections
// @route   GET /api/admin/elections
// @access  Private/Admin
router.get('/elections', protect, admin, getAllElections);

// @desc    Get single election
// @route   GET /api/admin/elections/:id
// @access  Private/Admin
router.get('/elections/:id', protect, admin, getElection);

// @desc    Update election
// @route   PUT /api/admin/elections/:id
// @access  Private/Admin
router.put('/elections/:id', protect, admin, updateElection);

// @desc    Delete election
// @route   DELETE /api/admin/elections/:id
// @access  Private/Admin
router.delete('/elections/:id', protect, admin, deleteElection);

// @desc    End election early
// @route   POST /api/admin/elections/:id/end
// @access  Private/Admin
router.post('/elections/:id/end', protect, admin, endElection);

// @desc    Get election results
// @route   GET /api/admin/elections/:id/results
// @access  Private/Admin
router.get('/elections/:id/results', protect, admin, getElectionResults);

// @desc    Manage users
// @route   GET /api/admin/users
// @access  Private/Admin
router.get('/users', protect, admin, manageUsers);

// @desc    Get user details
// @route   GET /api/admin/users/:id
// @access  Private/Admin
router.get('/users/:id', protect, admin, getUserDetails);

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
router.put('/users/:id/role', protect, admin, updateUserRole);

module.exports = router;
