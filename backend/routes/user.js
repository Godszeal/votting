const express = require('express');
const router = express.Router();

// Import userAuth middleware with error handling
let userAuth;
try {
  // Try multiple possible paths for userAuth
  try {
    userAuth = require('../middleware/userAuth');
  } catch (e) {
    try {
      userAuth = require('../../middleware/userAuth');
    } catch (e) {
      userAuth = require('../../../middleware/userAuth');
    }
  }
} catch (err) {
  console.error('❌ Critical error loading userAuth middleware:', err);
  
  // Create a dummy auth middleware for development
  userAuth = (req, res, next) => {
    console.warn('⚠️ Using dummy auth middleware - NOT SECURE for production!');
    req.user = { id: 'dev-user' };
    next();
  };
}

// Import controller with error handling
let userController;
try {
  userController = require('../controllers/user');
  
  // Verify exports are functions
  const requiredFunctions = ['getUserElections', 'castVote', 'getElectionResults'];
  requiredFunctions.forEach(func => {
    if (typeof userController[func] !== 'function') {
      throw new Error(`${func} is not a function`);
    }
  });
} catch (err) {
  console.error('❌ Critical error loading user controller:', err);
  // Create dummy functions to prevent server crash
  userController = {
    getUserElections: (req, res) => res.status(500).json({ 
      message: 'Service unavailable', 
      error: 'Controller loading error'
    }),
    castVote: (req, res) => res.status(500).json({ 
      message: 'Service unavailable', 
      error: 'Controller loading error'
    }),
    getElectionResults: (req, res) => res.status(500).json({ 
      message: 'Service unavailable', 
      error: 'Controller loading error'
    })
  };
}

// @route   GET /api/user/elections
// @desc    Get user's eligible elections
// @access  Private (User)
router.get('/elections', userAuth, userController.getUserElections);

// @route   POST /api/user/vote
// @desc    Cast a vote in an election
// @access  Private (User)
router.post('/vote', userAuth, userController.castVote);

// @route   GET /api/user/results/:id
// @desc    Get election results
// @access  Private (User)
router.get('/results/:id', userAuth, userController.getElectionResults);

module.exports = router;
