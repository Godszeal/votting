const Election = require('../models/Election');
const User = require('../models/User');
const crypto = require('crypto');

// @desc    Create a new election
// @route   POST /api/admin/elections
// @access  Private
exports.createElection = async (req, res) => {
  try {
    const { title, description, facultyRestriction, departmentRestrictions, candidates, endDate } = req.body;
    
    console.log('Creating new election:', title);
    
    // Generate a unique token for the voting link
    const votingLinkToken = crypto.randomBytes(8).toString('hex');
    
    const election = new Election({
      title,
      description,
      facultyRestriction,
      departmentRestrictions,
      candidates,
      endDate,
      votingLinkToken  // Ensure token is included
    });
    
    await election.save();
    
    console.log('Election created successfully:', election._id);
    
    res.status(201).json({
      message: 'Election created successfully',
      election: {
        _id: election._id,
        title: election.title,
        votingLink: `/voting/${votingLinkToken}`
      }
    });
  } catch (err) {
    console.error('Create Election Error:', err);
    
    // Handle duplicate key error specifically
    if (err.code === 11000) {
      return res.status(400).json({ 
        message: 'Election with this title already exists' 
      });
    }
    
    res.status(500).json({ 
      message: 'Server error creating election',
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

// @desc    Get all elections
// @route   GET /api/admin/elections
// @access  Private
exports.getElections = async (req, res) => {
  try {
    const elections = await Election.find().sort({ createdAt: -1 });
    
    res.json(elections);
  } catch (err) {
    console.error('Get Elections Error:', err);
    res.status(500).json({ 
      message: 'Server error fetching elections',
      error: err.message
    });
  }
};

// @desc    Get election by ID
// @route   GET /api/admin/elections/:id
// @access  Private
exports.getElectionById = async (req, res) => {
  try {
    const election = await Election.findById(req.params.id);
    
    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }
    
    res.json(election);
  } catch (err) {
    console.error('Get Election Error:', err);
    res.status(500).json({ 
      message: 'Server error fetching election',
      error: err.message
    });
  }
};

// @desc    Update election
// @route   PUT /api/admin/elections/:id
// @access  Private
exports.updateElection = async (req, res) => {
  try {
    const { title, description, facultyRestriction, departmentRestrictions, candidates, endDate, isActive } = req.body;
    
    let election = await Election.findById(req.params.id);
    
    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }
    
    // Only update fields that are provided
    election.title = title || election.title;
    election.description = description || election.description;
    election.facultyRestriction = facultyRestriction || election.facultyRestriction;
    election.departmentRestrictions = departmentRestrictions || election.departmentRestrictions;
    election.candidates = candidates || election.candidates;
    election.endDate = endDate || election.endDate;
    election.isActive = isActive !== undefined ? isActive : election.isActive;
    
    // If votingLinkToken is not set, generate a new one
    if (!election.votingLinkToken) {
      election.votingLinkToken = crypto.randomBytes(8).toString('hex');
    }
    
    await election.save();
    
    res.json({
      message: 'Election updated successfully',
      election: {
        _id: election._id,
        title: election.title,
        votingLink: `/voting/${election.votingLinkToken}`
      }
    });
  } catch (err) {
    console.error('Update Election Error:', err);
    
    // Handle duplicate key error specifically
    if (err.code === 11000) {
      return res.status(400).json({ 
        message: 'Election with this title already exists' 
      });
    }
    
    res.status(500).json({ 
      message: 'Server error updating election',
      error: err.message
    });
  }
};

// @desc    Delete election
// @route   DELETE /api/admin/elections/:id
// @access  Private
exports.deleteElection = async (req, res) => {
  try {
    const election = await Election.findById(req.params.id);
    
    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }
    
    await election.remove();
    
    res.json({ message: 'Election removed' });
  } catch (err) {
    console.error('Delete Election Error:', err);
    res.status(500).json({ 
      message: 'Server error deleting election',
      error: err.message
    });
  }
};

// @desc    Get all voters
// @route   GET /api/admin/voters
// @access  Private
exports.getAllVoters = async (req, res) => {
  try {
    const voters = await User.find({ role: 'user' }).select('-password');
    
    res.json(voters);
  } catch (err) {
    console.error('Get Voters Error:', err);
    res.status(500).json({ 
      message: 'Server error fetching voters',
      error: err.message
    });
  }
};

// @desc    Reset voter votes
// @route   PUT /api/admin/voters/:id/reset-votes
// @access  Private
exports.resetVoterVotes = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Reset votes
    user.hasVoted = [];
    
    await user.save();
    
    res.json({ message: 'Voter votes reset successfully' });
  } catch (err) {
    console.error('Reset Voter Votes Error:', err);
    res.status(500).json({ 
      message: 'Server error resetting voter votes',
      error: err.message
    });
  }
};

// @desc    Get voting link for election
// @route   GET /api/admin/elections/:id/link
// @access  Private
exports.getElectionVotingLink = async (req, res) => {
  try {
    const election = await Election.findById(req.params.id);
    
    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }
    
    // If votingLinkToken is not set, generate a new one
    if (!election.votingLinkToken) {
      election.votingLinkToken = crypto.randomBytes(8).toString('hex');
      await election.save();
    }
    
    res.json({
      votingLink: `/voting/${election.votingLinkToken}`
    });
  } catch (err) {
    console.error('Get Election Voting Link Error:', err);
    res.status(500).json({ 
      message: 'Server error getting voting link',
      error: err.message
    });
  }
};
