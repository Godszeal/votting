const Election = require('../models/Election');
const User = require('../models/User');
const crypto = require('crypto');

// @desc    Create a new election
// @route   POST /api/admin/elections
// @access  Private
exports.createElection = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        errors: errors.array(),
        message: 'Validation failed'
      });
    }

    const { title, description, facultyRestriction, departmentRestrictions, candidates, endDate } = req.body;
    
    console.log('Creating new election:', { 
      title, 
      description, 
      facultyRestriction, 
      departmentRestrictions,
      candidatesCount: candidates.length,
      endDate 
    });
    
    // Generate a unique voting link token
    let votingLinkToken;
    let isUnique = false;
    
    // Keep generating tokens until we get a unique one
    while (!isUnique) {
      votingLinkToken = crypto.randomBytes(8).toString('hex');
      
      // Check if this token already exists
      const existingElection = await Election.findOne({ votingLinkToken });
      if (!existingElection) {
        isUnique = true;
      }
    }
    
    console.log('Generated unique voting link token:', votingLinkToken);
    
    const election = new Election({
      title,
      description,
      facultyRestriction,
      departmentRestrictions: departmentRestrictions || [],
      candidates: candidates.map(candidate => ({
        name: candidate.name,
        votes: 0
      })),
      endDate: new Date(endDate),
      votingLinkToken,
      createdBy: req.user.id
    });

    await election.save();
    
    console.log('Election created successfully:', election._id);
    
    // Return the voting link
    const votingLink = `${process.env.BASE_URL}/voting/${votingLinkToken}`;
    
    res.status(201).json({
      _id: election._id,
      title: election.title,
      description: election.description,
      facultyRestriction: election.facultyRestriction,
      departmentRestrictions: election.departmentRestrictions,
      candidates: election.candidates,
      endDate: election.endDate,
      isActive: election.isActive,
      votingLinkToken: election.votingLinkToken,
      votingLink: votingLink,
      message: 'Election created successfully'
    });
  } catch (err) {
    console.error('Create Election Error:', err);
    
    // Handle duplicate key error specifically
    if (err.code === 11000 && err.keyPattern && err.keyPattern.votingLinkToken) {
      return res.status(400).json({
        message: 'Failed to create election - voting link conflict. Please try again.',
        error: 'Voting link token conflict'
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

// @desc    Get single election
// @route   GET /api/admin/elections/:id
// @access  Private
exports.getElection = async (req, res) => {
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
    
    const electionFields = {
      title,
      description,
      facultyRestriction,
      departmentRestrictions: departmentRestrictions || [],
      candidates: candidates.map(candidate => ({
        name: candidate.name,
        votes: candidate.votes
      })),
      endDate: endDate ? new Date(endDate) : undefined,
      isActive
    };
    
    // Remove undefined values
    Object.keys(electionFields).forEach(key => 
      electionFields[key] === undefined && delete electionFields[key]
    );
    
    let election = await Election.findById(req.params.id);
    
    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }
    
    election = await Election.findByIdAndUpdate(
      req.params.id,
      { $set: electionFields },
      { new: true }
    );
    
    res.json(election);
  } catch (err) {
    console.error('Update Election Error:', err);
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

// @desc    Get votes for election
// @route   GET /api/admin/elections/:id/votes
// @access  Private (Admin)
exports.getVotesForElection = async (req, res) => {
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
exports.getAllVoters = async (req, res) => {
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
exports.resetVoterVotes = async (req, res) => {
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
exports.getElectionVotingLink = async (req, res) => {
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
