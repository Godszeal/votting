const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const userController = require('../controllers/user');

// @route   GET /api/user/elections
// @desc    Get user's eligible elections
// @access  Private
router.get('/elections', auth, userController.getUserElections);

// @route   POST /api/user/vote
// @desc    Cast a vote in an election
// @access  Private
router.post('/vote', auth, userController.castVote);

// @route   GET /api/user/results/:id
// @desc    Get election results
// @access  Private
router.get('/results/:id', auth, userController.getElectionResults);

// @route   GET /api/user/voting-link/:token
// @desc    Get voting link details
// @access  Public
router.get('/voting-link/:token', userController.getVotingLinkDetails);

module.exports = router;
