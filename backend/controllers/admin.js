const Election = require('../models/Election');
const Vote = require('../models/Vote');
const User = require('../models/User');
const jwtConfig = require('../config/jwt');

// @desc    Create election
// @route   POST /api/admin/elections
// @access  Private (Admin)
const createElection = async (req, res) => {
  const { title, description, candidates, endDate, isActive, facultyRestriction, departmentRestrictions } = req.body;
  
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
      isActive: isActive !== undefined ? isActive : true,
      facultyRestriction: facultyRestriction || null,
      departmentRestrictions: departmentRestrictions || []
    });
    
    await election.save();
    
    // Generate the voting link
    const votingLink = `${process.env.BASE_URL}/voting/${election.votingLinkToken}`;
    
    res.status(201).json({
      ...election.toObject(),
      votingLink
    });
  } catch (err) {
    console.error('Create Election Error:', err);
    res.status(500).json({ 
      message: 'Server error creating election',
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

// @desc    Update election
// @route   PUT /api/admin/elections/:id
// @access  Private (Admin)
const updateElection = async (req, res) => {
  const { title, description, candidates, endDate, isActive, facultyRestriction, departmentRestrictions } = req.body;
  
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
    election.facultyRestriction = facultyRestriction !== undefined ? facultyRestriction : election.facultyRestriction;
    election.departmentRestrictions = departmentRestrictions !== undefined ? departmentRestrictions : election.departmentRestrictions;
    
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
    
    // Generate the voting link
    const votingLink = `${process.env.BASE_URL}/voting/${election.votingLinkToken}`;
    
    res.json({
      ...election.toObject(),
      votingLink
    });
  } catch (err) {
    console.error('Update Election Error:', err);
    res.status(500).json({ 
      message: 'Server error updating election',
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

// @desc    Get all elections
// @route   GET /api/admin/elections
// @access  Private (Admin)
const getAllElections = async (req, res) => {
  try {
    const elections = await Election.find().sort({ createdAt: -1 });
    
    // Add voting links to each election
    const electionsWithLinks = elections.map(election => {
      return {
        ...election.toObject(),
        votingLink: `${process.env.BASE_URL}/voting/${election.votingLinkToken}`
      };
    });
    
    res.json(electionsWithLinks);
  } catch (err) {
    console.error('Get Elections Error:', err);
    res.status(500).json({ 
      message: 'Server error fetching elections',
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

// @desc    Get votes for election
// @route   GET /api/admin/elections/:id/votes
// @access  Private (Admin)
const getVotesForElection = async (req, res) => {
  try {
    // Get votes with populated user details
    const votes = await Vote.find({ election: req.params.id })
      .populate('user', 'matricNumber faculty department')
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
};

// @desc    Get all voters
// @route   GET /api/admin/voters
// @access  Private (Admin)
const getAllVoters = async (req, res) => {
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
};

// @desc    Reset voter votes
// @route   PUT /api/admin/voters/:id/reset-votes
// @access  Private (Admin)
const resetVoterVotes = async (req, res) => {
  try {
    const voter = await User.findById(req.params.id);
    
    if (!voter) {
      return res.status(404).json({ message: 'Voter not found' });
    }
    
    voter.hasVoted = [];
    await voter.save();
    
    res.json({ 
      message: 'Voter votes reset successfully',
      voter: {
        _id: voter._id,
        matricNumber: voter.matricNumber,
        faculty: voter.faculty,
        department: voter.department,
        hasVoted: voter.hasVoted
      }
    });
  } catch (err) {
    console.error('Reset Votes Error:', err);
    res.status(500).json({ 
      message: 'Server error resetting votes',
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

// @desc    Get voting link for election
// @route   GET /api/admin/elections/:id/link
// @access  Private (Admin)
const getElectionVotingLink = async (req, res) => {
  try {
    const election = await Election.findById(req.params.id);
    
    if (!election) {
      return res.status(404).json({ 
        message: 'Election not found' 
      });
    }
    
    const votingLink = `${process.env.BASE_URL}/voting/${election.votingLinkToken}`;
    
    res.json({
      votingLink,
      electionId: election._id,
      title: election.title,
      facultyRestriction: election.facultyRestriction,
      departmentRestrictions: election.departmentRestrictions
    });
  } catch (err) {
    console.error('Get Voting Link Error:', err);
    res.status(500).json({ 
      message: 'Server error getting voting link',
      error: err.message
    });
  }
};

// Export as a single module object (more reliable pattern)
module.exports = {
  createElection,
  updateElection,
  getAllElections,
  getVotesForElection,
  getAllVoters,
  resetVoterVotes,
  getElectionVotingLink
};
