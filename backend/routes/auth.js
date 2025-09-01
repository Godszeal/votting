const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Election = require('../models/Election');
const jwtConfig = require('../config/jwt');

// @route   POST api/auth/signup
// @desc    Register user
router.post(
  '/signup',
  [
    check('matricNumber', 'Matric number is required').not().isEmpty(),
    check('faculty', 'Faculty is required').not().isEmpty(),
    check('department', 'Department is required').not().isEmpty(),
    check('password', 'Password must be 6 or more characters').isLength({ min: 6 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        errors: errors.array(),
        message: 'Validation failed'
      });
    }

    const { matricNumber, faculty, department, email, password, facultyToken } = req.body;

    try {
      let user = await User.findOne({ matricNumber });
      if (user) {
        return res.status(400).json({ 
          errors: [{ msg: 'User already exists' }], 
          message: 'User already exists'
        });
      }

      user = new User({
        matricNumber,
        faculty,
        department,
        email,
        password,
        facultyToken: facultyToken || null
      });

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      await user.save();

      const payload = {
        user: {
          id: user.id
        }
      };

      // Use our verified JWT config
      jwt.sign(
        payload,
        jwtConfig.secret,
        { expiresIn: jwtConfig.expiresIn },
        (err, token) => {
          if (err) {
            console.error('JWT Sign Error:', err);
            return res.status(500).send('Token generation error');
          }
          res.json({ token, role: user.role, faculty, department, electionId: user.facultyToken ? getElectionIdFromToken(user.facultyToken) : null });
        }
      );
    } catch (err) {
      console.error('Signup Error:', err.message);
      res.status(500).json({ 
        message: 'Server error during signup',
        error: err.message 
      });
    }
  }
);

// @route   POST api/auth/voting-signup
// @desc    Register user through voting link
router.post(
  '/voting-signup',
  [
    check('matricNumber', 'Matric number is required').not().isEmpty(),
    check('faculty', 'Faculty is required').not().isEmpty(),
    check('department', 'Department is required').not().isEmpty(),
    check('password', 'Password must be 6 or more characters').isLength({ min: 6 }),
    check('votingLinkToken', 'Voting link token is required').not().isEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        errors: errors.array(),
        message: 'Validation failed'
      });
    }

    const { matricNumber, faculty, department, email, password, votingLinkToken } = req.body;

    try {
      // Verify the voting link token
      const election = await Election.findOne({ votingLinkToken });
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

      let user = await User.findOne({ matricNumber });
      if (user) {
        return res.status(400).json({ 
          errors: [{ msg: 'User already exists' }], 
          message: 'User already exists'
        });
      }

      user = new User({
        matricNumber,
        faculty,
        department,
        email,
        password,
        facultyToken: votingLinkToken
      });

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      await user.save();

      const payload = {
        user: {
          id: user.id
        }
      };

      // Use our verified JWT config
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
            faculty,
            department,
            electionId: election._id
          });
        }
      );
    } catch (err) {
      console.error('Voting Signup Error:', err.message);
      res.status(500).json({ 
        message: 'Server error during signup',
        error: err.message 
      });
    }
  }
);

// @route   POST api/auth/login
// @desc    Authenticate user & get token
router.post(
  '/login',
  [
    check('matricNumber', 'Matric number is required').exists(),
    check('password', 'Password is required').exists()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

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
  }
);

// @route   POST api/auth/admin-login
// @desc    Admin login
router.post('/admin-login', async (req, res) => {
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
});

// Helper function to get election ID from token
function getElectionIdFromToken(token) {
  try {
    return Election.findOne({ votingLinkToken: token }).then(election => election ? election._id : null);
  } catch (err) {
    console.error('Error getting election ID from token:', err);
    return null;
  }
}

module.exports = router;
