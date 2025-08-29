const express = require('express');
const router = express.Router();
const {
  register,
  login,
  forgotPassword,
  resetPassword,
  getMe,
  logout
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);

// Private routes (require authentication)
router.route('/me').get(protect, getMe);
router.put('/reset-password', protect, resetPassword);
router.get('/logout', protect, logout);

module.exports = router;
