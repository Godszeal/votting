const express = require('express');
const router = express.Router();
const userAuth = require('../middleware/userAuth');

// Import controller with error handling
let userController;
try {
  userController = require('../controllers/user');
  
  // Verify exports are functions
  if (typeof userController.getUserElections !== 'function') {
    throw new Error('getUserElections is not a function');
  }
  if (typeof userController.castVote !== 'function') {
    throw new Error('castVote is not a function');
  }
  if (typeof userController.getElectionResults !== 'function') {
    throw new Error('getElectionResults is not a function');
  }
} catch (err) {
  console.error('Critical error loading user controller:', err);
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
