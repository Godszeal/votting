const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminController = require('../controllers/admin');
const { check, validationResult } = require('express-validator');

// @route   POST /api/admin/elections
// @desc    Create a new election
// @access  Private (Admin only)
router.post(
  '/elections',
  [
    auth,
    [
      check('title', 'Title is required').not().isEmpty(),
      check('description', 'Description is required').not().isEmpty(),
      check('endDate', 'End date is required').isISO8601(),
      check('candidates', 'At least one candidate is required').isArray({ min: 1 })
    ]
  ],
  adminController.createElection
);

// @route   GET /api/admin/elections
// @desc    Get all elections
// @access  Private (Admin only)
router.get('/elections', auth, adminController.getElections);

// @route   GET /api/admin/elections/:id
// @desc    Get single election
// @access  Private (Admin only)
router.get('/elections/:id', auth, adminController.getElection);

// @route   PUT /api/admin/elections/:id
// @desc    Update election
// @access  Private (Admin only)
router.put('/elections/:id', auth, adminController.updateElection);

// @route   DELETE /api/admin/elections/:id
// @desc    Delete election
// @access  Private (Admin only)
router.delete('/elections/:id', auth, adminController.deleteElection);

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
