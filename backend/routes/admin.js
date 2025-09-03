const express = require('express');
const router = express.Router();
const admin = require('../middleware/admin');
const adminController = require('../controllers/admin');

// @route   POST api/admin/elections
// @desc    Create new election
router.post('/elections', admin, adminController.createElection);

// @route   PUT api/admin/elections/:id
// @desc    Update election
router.put('/elections/:id', admin, adminController.updateElection);

// @route   DELETE api/admin/elections/:id
// @desc    Delete election
router.delete('/elections/:id', admin, adminController.deleteElection);

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
// router.get('/elections/:id/link', admin, adminController.getElectionVotingLink);

module.exports = router;
