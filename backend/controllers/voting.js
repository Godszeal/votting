const Election = require('../models/Election');
const path = require('path');
const crypto = require('crypto');

// @desc    Serve the voting page with token
// @route   GET /voting/:token
exports.serveVotingPage = async (req, res) => {
  try {
    const token = req.params.token;
    
    // Verify the token exists in an election
    const election = await Election.findOne({ votingLinkToken: token });
    
    if (!election) {
      console.error(`Invalid voting link token: ${token}`);
      // Return the voting page but with an error parameter
      return res.sendFile(path.join(__dirname, '../../public/voting.html'));
    }
    
    // Token is valid, serve the voting page
    res.sendFile(path.join(__dirname, '../../public/voting.html'));
  } catch (err) {
    console.error('Error serving voting page:', err);
    res.status(500).send('Server error');
  }
};

// @desc    Verify voting link token
// @route   GET /api/voting/link/:token
exports.verifyVotingLink = async (req, res) => {
  try {
    const token = req.params.token;
    console.log('Verifying voting link token:', token);
    
    // CRITICAL FIX: Check if token is valid format
    if (!token || token.includes('user-dashboard') || token.includes('index.html')) {
      console.error('Invalid token format:', token);
      return res.status(400).json({ 
        message: 'Invalid voting link token format' 
      });
    }
    
    const election = await Election.findOne({ votingLinkToken: token });
    
    if (!election) {
      console.error('Invalid voting link token:', token);
      return res.status(404).json({ 
        message: 'Invalid voting link' 
      });
    }
    
    console.log('Voting link verified for election:', election.title);
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
