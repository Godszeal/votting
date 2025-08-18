const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const User = require('../models/User');
const { check, validationResult } = require('express-validator');
const jwtConfig = require('../config/jwt'); // Import our verified JWT config

// @route   POST api/auth/signup
// @desc    Register user
router.post(
  '/signup',
  [
    check('matricNumber', 'Matric number is required').not().isEmpty(),
    check('university', 'University is required').not().isEmpty(),
    check('password', 'Password must be 6 or more characters').isLength({ min: 6 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { matricNumber, university, email, password } = req.body;

    try {
      let user = await User.findOne({ matricNumber });
      if (user) {
        return res.status(400).json({ errors: [{ msg: 'User already exists' }] });
      }

      user = new User({
        matricNumber,
        university,
        email,
        password
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
          res.json({ token, role: user.role });
        }
      );
    } catch (err) {
      console.error('Signup Error:', err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   POST api/auth/login
// @desc    Authenticate user
router.post(
  '/login',
  [
    check('matricNumber', 'Matric number is required').not().isEmpty(),
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
        return res.status(400).json({ errors: [{ msg: 'Invalid credentials' }] });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ errors: [{ msg: 'Invalid credentials' }] });
      }

      const payload = {
        user: {
          id: user.id,
          role: user.role
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
          res.json({ token, role: user.role });
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
        id: 'admin',  // This is the special ID for admin
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

module.exports = router;
