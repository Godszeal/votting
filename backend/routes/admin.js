const express = require('express');
const router = express.Router();
const admin = require('../middleware/admin');
const Election = require('../models/Election');
const Vote = require('../models/Vote');
const User = require('../models/User');
const jwtConfig = require('../config/jwt');

// @route   POST api/admin/elections
// @desc    Create new election
router.post('/elections', admin, async (req, res) => {
  const { title, description, candidates, endDate, isActive } = req.body;
  
  try {
    if (!title || !description || !candidates || !endDate) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        received: Object.keys(req.body)
      });
    }
    
    if (candidates.length < 2) {
      return res.status(400).json({ 
        message: 'At least 2 candidates are required' 
      });
    }
    
    const election = new Election({
      title,
      description,
      candidates: candidates.map(name => ({ name })),
      endDate: new Date(endDate),
      isActive: isActive !== undefined ? isActive : true
    });
    
    await election.save();
    res.status(201).json(election);
  } catch (err) {
    console.error('Create Election Error:', err);
    res.status(500).json({ 
      message: 'Server error creating election',
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// @route   PUT api/admin/elections/:id
// @desc    Update election
router.put('/elections/:id', admin, async (req, res) => {
  const { title, description, candidates, endDate, isActive } = req.body;
  
  try {
    let election = await Election.findById(req.params.id);
    if (!election) return res.status(404).json({ message: 'Election not found' });
    
    // Prevent candidate changes after election starts
    if (election.startDate < new Date() && candidates && election.candidates.length !== candidates.length) {
      return res.status(400).json({ 
        message: 'Cannot modify the number of candidates after election starts' 
      });
    }
    
    election.title = title || election.title;
    election.description = description || election.description;
    election.endDate = endDate ? new Date(endDate) : election.endDate;
    election.isActive = isActive !== undefined ? isActive : election.isActive;
    
    if (candidates) {
      // Update candidates while preserving vote counts
      const updatedCandidates = [];
      for (const name of candidates) {
        const existingCandidate = election.candidates.find(c => c.name === name);
        updatedCandidates.push({
          name,
          votes: existingCandidate ? existingCandidate.votes : 0
        });
      }
      election.candidates = updatedCandidates;
    }
    
    await election.save();
    res.json(election);
  } catch (err) {
    console.error('Update Election Error:', err);
    res.status(500).json({ 
      message: 'Server error updating election',
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// @route   DELETE api/admin/elections/:id
// @desc    Delete election
router.delete('/elections/:id', admin, async (req, res) => {
  try {
    const election = await Election.findById(req.params.id);
    if (!election) return res.status(404).json({ message: 'Election not found' });
    
    // Delete all votes for this election
    await Vote.deleteMany({ election: req.params.id });
    
    // Remove election reference from users
    await User.updateMany(
      { 'hasVoted.election': req.params.id },
      { $pull: { hasVoted: { election: req.params.id } } }
    );
    
    // Delete the election
    await election.remove();
    
    res.json({ message: 'Election and associated votes removed successfully' });
  } catch (err) {
    console.error('Delete Election Error:', err);
    res.status(500).json({ 
      message: 'Server error deleting election',
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// @route   GET api/admin/elections
// @desc    Get all elections
router.get('/elections', admin, async (req, res) => {
  try {
    const elections = await Election.find().sort({ createdAt: -1 });
    res.json(elections);
  } catch (err) {
    console.error('Get Elections Error:', err);
    res.status(500).json({ 
      message: 'Server error fetching elections',
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// @route   GET api/admin/elections/:id/votes
// @desc    Get all votes for an election (with voter details)
router.get('/elections/:id/votes', admin, async (req, res) => {
  try {
    // Get votes with populated user details
    const votes = await Vote.find({ election: req.params.id })
      .populate('user', 'matricNumber university')
      .sort({ timestamp: -1 });
    
    res.json(votes);
  } catch (err) {
    console.error('Get Votes Error:', err);
    res.status(500).json({ 
      message: 'Server error fetching votes',
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// @route   DELETE api/admin/votes/:id
// @desc    Remove a specific vote (audit trail)
router.delete('/votes/:id', admin, async (req, res) => {
  try {
    const vote = await Vote.findById(req.params.id);
    if (!vote) {
      return res.status(404).json({ message: 'Vote not found' });
    }
    
    // Get election and candidate info before deleting
    const election = await Election.findById(vote.election);
    if (!election) {
      return res.status(404).json({ message: 'Associated election not found' });
    }
    
    // Find and decrement the candidate's vote count
    const candidateIndex = election.candidates.findIndex(c => c.name === vote.candidate);
    if (candidateIndex !== -1 && election.candidates[candidateIndex].votes > 0) {
      election.candidates[candidateIndex].votes--;
      await election.save();
    }
    
    // Remove the vote reference from the user
    await User.findByIdAndUpdate(
      vote.user,
      { $pull: { hasVoted: { election: vote.election } } }
    );
    
    // Delete the vote
    await vote.remove();
    
    res.json({ 
      message: 'Vote removed successfully',
      voteId: req.params.id,
      electionId: vote.election,
      candidate: vote.candidate
    });
  } catch (err) {
    console.error('Delete Vote Error:', err);
    res.status(500).json({ 
      message: 'Server error removing vote',
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// @route   GET api/admin/voters
// @desc    Get all voters
router.get('/voters', admin, async (req, res) => {
  try {
    const voters = await User.find({ role: 'user' }).select('-password');
    res.json(voters);
  } catch (err) {
    console.error('Get Voters Error:', err);
    res.status(500).json({ 
      message: 'Server error fetching voters',
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// @route   PUT api/admin/voters/:id/reset-votes
// @desc    Reset a voter's votes
router.put('/voters/:id/reset-votes', admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Remove all vote references for this user
    user.hasVoted = [];
    await user.save();
    
    res.json({ 
      message: 'Voter\'s votes reset successfully',
      voterId: req.params.id,
      matricNumber: user.matricNumber
    });
  } catch (err) {
    console.error('Reset Votes Error:', err);
    res.status(500).json({ 
      message: 'Server error resetting votes',
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

module.exports = router;
