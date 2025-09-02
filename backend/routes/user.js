const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const userController = require('../controllers/user');

// Verify controller functions exist before using them
console.log('User controller functions:');
console.log('getUserElections:', userController.getUserElections ? 'FOUND' : 'NOT FOUND');
console.log('castVote:', userController.castVote ? 'FOUND' : 'NOT FOUND');
console.log('getElectionResults:', userController.getElectionResults ? 'FOUND' : 'NOT FOUND');
console.log('checkElectionEligibility:', userController.checkElectionEligibility ? 'FOUND' : 'NOT FOUND');
console.log('getVotingLinkDetails:', userController.getVotingLinkDetails ? 'FOUND' : 'NOT FOUND');

// Helper function to ensure controller methods exist
const validateController = (controller, methodName) => {
  if (typeof controller[methodName] !== 'function') {
    console.error(`Controller method ${methodName} is not a function!`);
    return (req, res) => {
      res.status(500).json({ 
        message: `Server error: ${methodName} is not properly defined`,
        error: `Method ${methodName} is undefined`
      });
    };
  }
  return controller[methodName];
};

// @route   GET /api/user/elections
// @desc    Get user's eligible elections
// @access  Private
router.get('/elections', auth, validateController(userController, 'getUserElections'));

// @route   POST /api/user/vote
// @desc    Cast a vote in an election
// @access  Private
router.post('/vote', auth, validateController(userController, 'castVote'));

// @route   GET /api/user/results/:id
// @desc    Get election results
// @access  Private
router.get('/results/:id', auth, validateController(userController, 'getElectionResults'));

// @route   GET /api/user/elections/:id/eligibility
// @desc    Check if user is eligible for an election
// @access  Private
router.get('/elections/:id/eligibility', auth, validateController(userController, 'checkElectionEligibility'));

// @route   GET /api/user/voting-link/:token
// @desc    Get voting link details
// @access  Public
router.get('/voting-link/:token', validateController(userController, 'getVotingLinkDetails'));

module.exports = router;
