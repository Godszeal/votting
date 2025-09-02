const express = require('express');
const router = express.Router();
const votingController = require('../controllers/voting');

// @route   GET /voting/:token
// @desc    Serve the voting page with token
router.get('/:token', votingController.serveVotingPage);

// @route   GET /api/user/voting-link/:token
// @desc    Verify voting link token
router.get('/api/user/voting-link/:token', votingController.verifyVotingLink);

module.exports = router;
