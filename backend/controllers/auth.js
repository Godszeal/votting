const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Election = require('../models/Election');
const Vote = require('../models/Vote');
const jwtConfig = require('../config/jwt');

// @desc    Register user
// @route   POST /api/auth/signup
// @access  Public
exports.signup = async (req, res) => {
  const { matricNumber, faculty, department, email, password, facultyToken } = req.body;
  
  try {
    // Check if user already exists
    let user = await User.findOne({ matricNumber });
    
    if (user) {
      return res.status(400).json({ 
        errors: [{ msg: 'User already exists' }], 
        message: 'User already exists'
      });
    }
    
    // Verify faculty token if provided
    if (facultyToken) {
      const election = await Election.findOne({ votingLinkToken: facultyToken });
      if (!election) {
        return res.status(400).json({ 
          errors: [{ msg: 'Invalid voting link' }], 
          message: 'Invalid voting link'
        });
      }
      
      // Check if faculty matches the restriction
      if (election.facultyRestriction && election.facultyRestriction !== faculty) {
        return res.status(400).json({ 
          errors: [{ 
            msg: `This election is restricted to ${election.facultyRestriction} faculty` 
          }], 
          message: 'Faculty mismatch'
        });
      }
      
      // Check if department is allowed
      if (election.departmentRestrictions.length > 0 && 
          !election.departmentRestrictions.includes(department)) {
        return res.status(400).json({ 
          errors: [{ 
            msg: `This election is restricted to specific departments` 
          }], 
          message: 'Department mismatch'
        });
      }
    }
    
    user = new User({
      matricNumber,
      faculty,
      department,
      email,
      password,
      facultyToken: facultyToken || null
    });
    
    // Encrypt password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    
    await user.save();
    
    // Return JWT
    const payload = {
      user: {
        id: user.id
      }
    };
    
    jwt.sign(
      payload,
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn },
      (err, token) => {
        if (err) {
          console.error('JWT Sign Error:', err);
          return res.status(500).send('Token generation error');
        }
        res.json({ 
          token, 
          role: user.role,
          faculty: user.faculty,
          department: user.department,
          facultyToken: user.facultyToken
        });
      }
    );
  } catch (err) {
    console.error('Signup Error:', err.message);
    res.status(500).json({ 
      message: 'Server error during signup',
      error: err.message 
    });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  const { matricNumber, password } = req.body;
  
  try {
    let user = await User.findOne({ matricNumber });
    
    if (!user) {
      return res.status(400).json({ 
        errors: [{ msg: 'Invalid credentials' }] 
      });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(400).json({ 
        errors: [{ msg: 'Invalid credentials' }] 
      });
    }
    
    const payload = {
      user: {
        id: user.id
      }
    };
    
    jwt.sign(
      payload,
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn },
      (err, token) => {
        if (err) {
          console.error('JWT Sign Error:', err);
          return res.status(500).send('Token generation error');
        }
        res.json({ 
          token, 
          role: user.role,
          faculty: user.faculty,
          department: user.department,
          facultyToken: user.facultyToken
        });
      }
    );
  } catch (err) {
    console.error('Login Error:', err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Admin login
// @route   POST /api/auth/admin-login
// @access  Public
exports.adminLogin = async (req, res) => {
  const { email, password } = req.body;
  
  if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
    const payload = {
      user: {
        id: 'admin',
        role: 'admin'
      }
    };

    // Use our verified JWT config
    jwt.sign(
      payload,
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn },
      (err, token) => {
        if (err) {
          console.error('Admin JWT Sign Error:', err);
          return res.status(500).send('Token generation error');
        }
        res.json({ 
          token, 
          role: 'admin',
          message: 'Admin login successful'
        });
      }
    );
  } else {
    res.status(400).json({ 
      errors: [{ 
        msg: 'Invalid admin credentials' 
      }],
      providedEmail: email
    });
  }
};

// @desc    Get voting link details
// @route   GET /api/auth/voting-link/:token
// @access  Public
exports.getVotingLinkDetails = async (req, res) => {
  try {
    const election = await Election.findOne({ votingLinkToken: req.params.token });
    
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
