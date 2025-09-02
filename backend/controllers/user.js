const User = require('../models/User');
const Election = require('../models/Election');
const Vote = require('../models/Vote');
const jwtConfig = require('../config/jwt');

// @desc    Get user elections
// @route   GET /api/user/elections
// @access  Private
exports.getUserElections = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get all active elections
    const elections = await Election.find({ 
      isActive: true,
      endDate: { $gt: new Date() }
    });
    
    // Filter elections based on user's faculty and department
    const eligibleElections = elections.filter(election => {
      // If no restrictions, user is eligible
      if (!election.facultyRestriction && election.departmentRestrictions.length === 0) {
        return true;
      }
      
      // Check faculty restriction
      if (election.facultyRestriction && election.facultyRestriction !== user.faculty) {
        return false;
      }
      
      // Check department restrictions
      if (election.departmentRestrictions.length > 0 && 
          !election.departmentRestrictions.includes(user.department)) {
        return false;
      }
      
      // Check if user has already voted
      if (user.hasVoted.some(vote => vote.election.toString() === election._id.toString())) {
        return false;
      }
      
      return true;
    });
    
    res.json(eligibleElections);
  } catch (err) {
    console.error('Get User Elections Error:', err);
    res.status(500).json({ 
      message: 'Server error fetching elections',
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

// @desc    Cast a vote
// @route   POST /api/user/vote
// @access  Private
exports.castVote = async (req, res) => {
  const { electionId, candidate } = req.body;
  
  try {
    const user = await User.findById(req.user.id);
    const election = await Election.findById(electionId);
    
    if (!user || !election) {
      return res.status(404).json({ 
        message: 'User or election not found' 
      });
    }
    
    // Check if user has already voted in this election
    if (user.hasVoted.some(vote => vote.election.toString() === electionId)) {
      return res.status(400).json({ 
        message: 'You have already voted in this election' 
      });
    }
    
    // Check if election is still active
    if (!election.isActive || new Date() > new Date(election.endDate)) {
      return res.status(400).json({ 
        message: 'This election is no longer active' 
      });
    }
    
    // Check if user is eligible to vote in this election
    if (election.facultyRestriction && election.facultyRestriction !== user.faculty) {
      return res.status(400).json({ 
        message: `This election is restricted to ${election.facultyRestriction} faculty` 
      });
    }
    
    if (election.departmentRestrictions.length > 0 && 
        !election.departmentRestrictions.includes(user.department)) {
      return res.status(400).json({ 
        message: 'This election is restricted to specific departments' 
      });
    }
    
    // Check if candidate exists
    const candidateObj = election.candidates.find(c => c.name === candidate);
    if (!candidateObj) {
      return res.status(400).json({ 
        message: 'Invalid candidate selection' 
      });
    }
    
    // Record the vote
    candidateObj.votes += 1;
    
    // Add to user's voted elections
    user.hasVoted.push({ election: electionId });
    
    // Save changes
    await election.save();
    await user.save();
    
    // Create vote record
    const vote = new Vote({
      user: user._id,
      election: electionId,
      candidate
    });
    
    await vote.save();
    
    res.json({ 
      message: 'Vote recorded successfully',
      election: {
        _id: election._id,
        title: election.title,
        description: election.description,
        candidates: election.candidates,
        endDate: election.endDate,
        isActive: election.isActive
      }
    });
  } catch (err) {
    console.error('Cast Vote Error:', err);
    res.status(500).json({ 
      message: 'Server error recording vote',
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

// @desc    Get election results
// @route   GET /api/user/results/:id
// @access  Private
exports.getElectionResults = async (req, res) => {
  try {
    const election = await Election.findById(req.params.id);
    
    if (!election) {
      return res.status(404).json({ 
        message: 'Election not found' 
      });
    }
    
    // Check if user is eligible to view results
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ 
        message: 'User not found' 
      });
    }
    
    // Check if election has ended
    if (new Date() < new Date(election.endDate)) {
      return res.status(400).json({ 
        message: 'Election results are not available yet' 
      });
    }
    
    res.json({
      _id: election._id,
      title: election.title,
      description: election.description,
      candidates: election.candidates,
      endDate: election.endDate,
      isActive: election.isActive,
      facultyRestriction: election.facultyRestriction,
      departmentRestrictions: election.departmentRestrictions
    });
  } catch (err) {
    console.error('Get Results Error:', err);
    res.status(500).json({ 
      message: 'Server error fetching results',
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

// @desc    Check if user is eligible for an election
// @route   GET /api/user/elections/:id/eligibility
// @access  Private
exports.checkElectionEligibility = async (req, res) => {
  try {
    const election = await Election.findById(req.params.id);
    
    if (!election) {
      return res.status(404).json({ 
        message: 'Election not found' 
      });
    }
    
    // Check if user is eligible to vote in this election
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ 
        message: 'User not found' 
      });
    }
    
    // Check if user has already voted
    if (user.hasVoted.some(vote => vote.election.toString() === req.params.id)) {
      return res.json({ 
        eligible: false,
        reason: 'You have already voted in this election'
      });
    }
    
    // Check if election is still active
    if (!election.isActive || new Date() > new Date(election.endDate)) {
      return res.json({ 
        eligible: false,
        reason: 'This election is no longer active'
      });
    }
    
    // Check if user is eligible to vote in this election
    if (election.facultyRestriction && election.facultyRestriction !== user.faculty) {
      return res.json({ 
        eligible: false,
        reason: `This election is restricted to ${election.facultyRestriction} faculty`
      });
    }
    
    if (election.departmentRestrictions.length > 0 && 
        !election.departmentRestrictions.includes(user.department)) {
      return res.json({ 
        eligible: false,
        reason: 'This election is restricted to specific departments'
      });
    }
    
    res.json({ 
      eligible: true,
      electionId: election._id,
      title: election.title
    });
  } catch (err) {
    console.error('Check Election Eligibility Error:', err);
    res.status(500).json({ 
      message: 'Server error checking election eligibility',
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

// @desc    Get voting link details
// @route   GET /api/user/voting-link/:token
// @access  Public
exports.getVotingLinkDetails = async (req, res) => {
  try {
    const token = req.params.token;
    console.log('Fetching voting link details for token:', token);
    
    const election = await Election.findOne({ votingLinkToken: token });
    
    if (!election) {
      console.error('Invalid voting link token:', token);
      return res.status(404).json({ 
        message: 'Invalid voting link' 
      });
    }
    
    console.log('Voting link details found for election:', election.title);
    res.json({
      electionId: election._id,
      title: election.title,
      facultyRestriction: election.facultyRestriction,
      departmentRestrictions: election.departmentRestrictions
    });
  } catch (err) {
    console.error('Voting Link Error:', err);
    res.status(500).json({ 
      message: 'Server error',
      error: err.message 
    });
  }
};
