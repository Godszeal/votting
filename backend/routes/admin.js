const express = require('express');
const router = express.Router();
const admin = require('../middleware/admin');

// Import controller with error handling
let adminController;
try {
  adminController = require('../controllers/admin');
  
  // Verify exports are functions
  const requiredFunctions = [
    'createElection', 'updateElection', 'getAllElections',
    'getVotesForElection', 'getAllVoters', 'resetVoterVotes',
    'getElectionVotingLink'
  ];
  
  requiredFunctions.forEach(func => {
    if (typeof adminController[func] !== 'function') {
      throw new Error(`${func} is not a function`);
    }
  });
} catch (err) {
  console.error('Critical error loading admin controller:', err);
  // Create dummy functions to prevent server crash
  const errorResponse = (req, res) => res.status(500).json({ 
    message: 'Service unavailable', 
    error: 'Controller loading error'
  });
  
  adminController = {
    createElection: errorResponse,
    updateElection: errorResponse,
    getAllElections: errorResponse,
    getVotesForElection: errorResponse,
    getAllVoters: errorResponse,
    resetVoterVotes: errorResponse,
    getElectionVotingLink: errorResponse
  };
}

// @route   POST api/admin/elections
// @desc    Create new election
router.post('/elections', admin, adminController.createElection);

// @route   PUT api/admin/elections/:id
// @desc    Update election
router.put('/elections/:id', admin, adminController.updateElection);

// @route   GET api/admin/elections
// @desc    Get all elections
router.get('/elections', admin, adminController.getAllElections);

// @route   GET api/admin/elections/:id/votes
// @desc    Get all votes for an election
router.get('/elections/:id/votes', admin, adminController.getVotesForElection);

// @route   GET api/admin/voters
// @desc    Get all voters
router.get('/voters', admin, adminController.getAllVoters);

// @route   PUT api/admin/voters/:id/reset-votes
// @desc    Reset voter votes
router.put('/voters/:id/reset-votes', admin, adminController.resetVoterVotes);

// @route   GET api/admin/elections/:id/link
// @desc    Get voting link for election
router.get('/elections/:id/link', admin, adminController.getElectionVotingLink);

module.exports = router;
