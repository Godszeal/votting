const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

// Verify controller functions are properly loaded
console.log('Admin controller loaded:', {
  createElection: typeof adminController.createElection,
  getAllElections: typeof adminController.getAllElections
});

// @desc    Create new election
// @route   POST /api/admin/elections
// @access  Private/Admin
router.post('/elections', protect, admin, (req, res, next) => {
  if (typeof adminController.createElection !== 'function') {
    console.error('createElection function is undefined. Check adminController.js');
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error: createElection function is not defined'
    });
  }
  adminController.createElection(req, res, next);
});

// @desc    Get all elections
// @route   GET /api/admin/elections
// @access  Private/Admin
router.get('/elections', protect, admin, (req, res, next) => {
  if (typeof adminController.getAllElections !== 'function') {
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error: getAllElections function is not defined'
    });
  }
  adminController.getAllElections(req, res, next);
});

// @desc    Get single election
// @route   GET /api/admin/elections/:id
// @access  Private/Admin
router.get('/elections/:id', protect, admin, (req, res, next) => {
  if (typeof adminController.getElection !== 'function') {
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error: getElection function is not defined'
    });
  }
  adminController.getElection(req, res, next);
});

// @desc    Update election
// @route   PUT /api/admin/elections/:id
// @access  Private/Admin
router.put('/elections/:id', protect, admin, (req, res, next) => {
  if (typeof adminController.updateElection !== 'function') {
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error: updateElection function is not defined'
    });
  }
  adminController.updateElection(req, res, next);
});

// @desc    Delete election
// @route   DELETE /api/admin/elections/:id
// @access  Private/Admin
router.delete('/elections/:id', protect, admin, (req, res, next) => {
  if (typeof adminController.deleteElection !== 'function') {
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error: deleteElection function is not defined'
    });
  }
  adminController.deleteElection(req, res, next);
});

// @desc    End election early
// @route   POST /api/admin/elections/:id/end
// @access  Private/Admin
router.post('/elections/:id/end', protect, admin, (req, res, next) => {
  if (typeof adminController.endElection !== 'function') {
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error: endElection function is not defined'
    });
  }
  adminController.endElection(req, res, next);
});

// @desc    Get election results
// @route   GET /api/admin/elections/:id/results
// @access  Private/Admin
router.get('/elections/:id/results', protect, admin, (req, res, next) => {
  if (typeof adminController.getElectionResults !== 'function') {
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error: getElectionResults function is not defined'
    });
  }
  adminController.getElectionResults(req, res, next);
});

// @desc    Manage users
// @route   GET /api/admin/users
// @access  Private/Admin
router.get('/users', protect, admin, (req, res, next) => {
  if (typeof adminController.manageUsers !== 'function') {
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error: manageUsers function is not defined'
    });
  }
  adminController.manageUsers(req, res, next);
});

// @desc    Get user details
// @route   GET /api/admin/users/:id
// @access  Private/Admin
router.get('/users/:id', protect, admin, (req, res, next) => {
  if (typeof adminController.getUserDetails !== 'function') {
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error: getUserDetails function is not defined'
    });
  }
  adminController.getUserDetails(req, res, next);
});

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
router.put('/users/:id/role', protect, admin, (req, res, next) => {
  if (typeof adminController.updateUserRole !== 'function') {
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error: updateUserRole function is not defined'
    });
  }
  adminController.updateUserRole(req, res, next);
});

module.exports = router;
