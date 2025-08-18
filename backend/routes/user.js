const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Election = require('../models/Election');
const Vote = require('../models/Vote');
const User = require('../models/User');
const mongoose = require('mongoose');

// @route   GET api/user/elections
// @desc    Get active elections (only those user is eligible for)
router.get('/elections', auth, async (req, res) => {
  try {
    const now = new Date();
    const user = await User.findById(req.user.id);
    
    // Find all active elections
    let elections = await Election.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now }
    });
    
    // Filter elections based on user's university/department
    const eligibleElections = elections.filter(election => {
      // No restrictions - everyone can vote
      if (!election.universityRestriction && !election.departmentRestriction) {
        return true;
      }
      
      // University restriction check
      if (election.universityRestriction && election.universityRestriction !== 'All Universities') {
        if (user.university !== election.universityRestriction) {
          return false;
        }
      }
      
      // Department restriction check
      if (election.departmentRestriction && election.departmentRestriction !== 'All Departments') {
        if (user.department !== election.departmentRestriction) {
          return false;
        }
      }
      
      return true;
    });
    
    res.json(eligibleElections);
  } catch (err) {
    console.error('Get Eligible Elections Error:', err);
    res.status(500).json({ 
      message: 'Server error fetching elections',
      error: err.message 
    });
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
    
    // Check if user is eligible based on university/department
    const user = await User.findById(req.user.id);
    if (election.universityRestriction && election.universityRestriction !== 'All Universities' && 
        user.university !== election.universityRestriction) {
      return res.status(403).json({ 
        msg: `This election is restricted to ${election.universityRestriction} students` 
      });
    }
    
    if (election.departmentRestriction && election.departmentRestriction !== 'All Departments' && 
        user.department !== election.departmentRestriction) {
      return res.status(403).json({ 
        msg: `This election is restricted to ${election.departmentRestriction} students` 
      });
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
    console.error('Vote Error:', err);
    res.status(500).json({ 
      message: 'Server error recording vote',
      error: err.message 
    });
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

    // Check if user is eligible to view results
    const user = await User.findById(req.user.id);
    if (election.universityRestriction && election.universityRestriction !== 'All Universities' && 
        user.university !== election.universityRestriction) {
      return res.status(403).json({ 
        msg: `Results are restricted to ${election.universityRestriction} students` 
      });
    }
    
    if (election.departmentRestriction && election.departmentRestriction !== 'All Departments' && 
        user.department !== election.departmentRestriction) {
      return res.status(403).json({ 
        msg: `Results are restricted to ${election.departmentRestriction} students` 
      });
    }

    res.json({
      title: election.title,
      description: election.description,
      universityRestriction: election.universityRestriction,
      departmentRestriction: election.departmentRestriction,
      candidates: election.candidates
    });
  } catch (err) {
    console.error('Results Error:', err);
    res.status(500).json({ 
      message: 'Server error fetching results',
      error: err.message 
    });
  }
});

module.exports = router;
