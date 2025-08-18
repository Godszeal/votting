const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Election = require('../models/Election');
const Vote = require('../models/Vote');
const User = require('../models/User');
const mongoose = require('mongoose');

// @route   GET api/user/elections
// @desc    Get active elections
router.get('/elections', auth, async (req, res) => {
  try {
    const now = new Date();
    const elections = await Election.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now }
    });

    res.json(elections);
  } catch (err) {
    console.error('Get Elections Error:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/user/vote
// @desc    Cast vote
router.post('/vote', auth, async (req, res) => {
  const { electionId, candidate } = req.body;
  
  try {
    // Check if user has already voted
    const hasVoted = req.user.hasVoted.some(vote => 
      vote.election.toString() === electionId
    );
    
    if (hasVoted) {
      return res.status(400).json({ msg: 'You have already voted in this election' });
    }

    // Check election validity
    const election = await Election.findById(electionId);
    if (!election || !election.isActive || new Date() > election.endDate) {
      return res.status(400).json({ msg: 'Election is not active' });
    }

    // Check candidate exists
    const candidateIndex = election.candidates.findIndex(c => c.name === candidate);
    if (candidateIndex === -1) {
      return res.status(400).json({ msg: 'Invalid candidate' });
    }

    // Record vote in transaction
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Create vote record
      await Vote.create([{ 
        user: req.user._id, 
        election: electionId, 
        candidate 
      }], { session });

      // Update candidate vote count
      election.candidates[candidateIndex].votes += 1;
      await election.save({ session });

      // Mark user as voted
      req.user.hasVoted.push({ election: electionId });
      await req.user.save({ session });

      await session.commitTransaction();
      res.json({ msg: 'Vote recorded successfully' });
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  } catch (err) {
    console.error('Vote Error:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/user/results
// @desc    Get election results
router.get('/results/:id', auth, async (req, res) => {
  try {
    const election = await Election.findById(req.params.id);
    if (!election) {
      return res.status(404).json({ msg: 'Election not found' });
    }

    res.json({
      title: election.title,
      candidates: election.candidates
    });
  } catch (err) {
    console.error('Results Error:', err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
