const Election = require('../models/Election');
const path = require('path');

// @desc    Serve the voting page with token
// @route   GET /voting/:token
exports.serveVotingPage = async (req, res) => {
  try {
    const token = req.params.token;
    
    // Verify the token exists in an election
    const election = await Election.findOne({ votingLinkToken: token });
    
    if (!election) {
      // If token is invalid, serve the voting page with error parameter
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
    
    const election = await Election.findOne({ votingLinkToken: token });
    
    if (!election) {
      return res.status(404).json({ 
        message: 'Invalid voting link' 
      });
    }
    
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
