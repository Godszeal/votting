const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');

// Import controller with error handling
let authController;
try {
  authController = require('../controllers/auth');
  
  // Verify exports are functions
  if (typeof authController.signup !== 'function') {
    throw new Error('signup is not a function');
  }
  if (typeof authController.login !== 'function') {
    throw new Error('login is not a function');
  }
  if (typeof authController.adminLogin !== 'function') {
    throw new Error('adminLogin is not a function');
  }
  if (typeof authController.getVotingLinkDetails !== 'function') {
    throw new Error('getVotingLinkDetails is not a function');
  }
} catch (err) {
  console.error('Critical error loading auth controller:', err);
  // Create dummy functions to prevent server crash
  authController = {
    signup: (req, res) => res.status(500).json({ 
      message: 'Service unavailable', 
      error: 'Controller loading error'
    }),
    login: (req, res) => res.status(500).json({ 
      message: 'Service unavailable', 
      error: 'Controller loading error'
    }),
    adminLogin: (req, res) => res.status(500).json({ 
      message: 'Service unavailable', 
      error: 'Controller loading error'
    }),
    getVotingLinkDetails: (req, res) => res.status(500).json({ 
      message: 'Service unavailable', 
      error: 'Controller loading error'
    })
  };
}

// @route   POST api/auth/signup
// @desc    Register user
router.post(
  '/signup',
  [
    check('matricNumber', 'Matric number is required').not().isEmpty(),
    check('faculty', 'Faculty is required').not().isEmpty(),
    check('department', 'Department is required').not().isEmpty(),
    check('password', 'Password must be 6 or more characters').isLength({ min: 6 })
  ],
  authController.signup
);

// @route   GET api/auth/voting-link/:token
// @desc    Get voting link details
router.get('/voting-link/:token', authController.getVotingLinkDetails);

// @route   POST api/auth/voting-signup
// @desc    Register user through voting link
router.post(
  '/voting-signup',
  [
    check('matricNumber', 'Matric number is required').not().isEmpty(),
    check('faculty', 'Faculty is required').not().isEmpty(),
    check('department', 'Department is required').not().isEmpty(),
    check('password', 'Password must be 6 or more characters').isLength({ min: 6 }),
    check('votingLinkToken', 'Voting link token is required').not().isEmpty()
  ],
  authController.signup
);

// @route   POST api/auth/login
// @desc    Authenticate user & get token
router.post(
  '/login',
  [
    check('matricNumber', 'Matric number is required').exists(),
    check('password', 'Password is required').exists()
  ],
  authController.login
);

// @route   POST api/auth/admin-login
// @desc    Admin login
router.post('/admin-login', authController.adminLogin);

module.exports = router;
