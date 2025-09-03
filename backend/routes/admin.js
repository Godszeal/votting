const express = require('express');
const router = express.Router();
const { admin } = require('../middleware/auth');
const adminController = require('../controllers/admin');

// @route   POST api/admin/elections
// @desc    Create a new election
// @access  Private
router.post('/elections', admin, adminController.createElection);

// @route   GET api/admin/elections
// @desc    Get all elections
// @access  Private
router.get('/elections', admin, adminController.getElections);

// @route   GET api/admin/elections/:id
// @desc    Get election by ID
// @access  Private
router.get('/elections/:id', admin, adminController.getElectionById);

// @route   PUT api/admin/elections/:id
// @desc    Update an election
// @access  Private
router.put('/elections/:id', admin, adminController.updateElection);

// @route   DELETE api/admin/elections/:id
// @desc    Delete an election
// @access  Private
router.delete('/elections/:id', admin, adminController.deleteElection);

// @route   GET api/admin/voters
// @desc    Get all voters
// @access  Private
router.get('/voters', admin, adminController.getAllVoters);

// @route   PUT api/admin/voters/:id/reset-votes
// @desc    Reset voter votes
router.put('/voters/:id/reset-votes', admin, adminController.resetVoterVotes);

// @route   GET api/admin/elections/:id/link
// @desc    Get voting link for election
router.get('/elections/:id/link', admin, adminController.getElectionVotingLink);

module.exports = router;
