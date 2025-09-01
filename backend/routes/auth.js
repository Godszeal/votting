const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Election = require('../models/Election');
const jwtConfig = require('../config/jwt');
const authController = require('../controllers/auth');

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
  authController.signup
);

// @route   GET api/auth/voting-link/:token
// @desc    Get voting link details
router.get('/voting-link/:token', authController.getVotingLinkDetails);

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
  authController.signup
);

// @route   POST api/auth/login
// @desc    Authenticate user & get token
router.post(
  '/login',
  [
    check('matricNumber', 'Matric number is required').exists(),
    check('password', 'Password is required').exists()
  ],
  authController.login
);

// @route   POST api/auth/admin-login
// @desc    Admin login
router.post('/admin-login', authController.adminLogin);

module.exports = router;
