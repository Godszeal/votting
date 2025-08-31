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

// Verify controller functions exist
console.log('Auth controller functions available:', {
  register: typeof register === 'function',
  login: typeof login === 'function',
  forgotPassword: typeof forgotPassword === 'function',
  resetPassword: typeof resetPassword === 'function',
  getMe: typeof getMe === 'function',
  logout: typeof logout === 'function'
});

// Helper function to safely define routes
const safeRoute = (method, path, ...middlewares) => {
  // Remove any undefined middleware functions
  const validMiddlewares = middlewares.filter(mw => typeof mw === 'function');
  
  if (validMiddlewares.length === 0) {
    console.error(`No valid middleware functions for ${method.toUpperCase()} ${path}`);
    return;
  }
  
  // Define the route with the valid middleware chain
  router[method](path, ...validMiddlewares);
};

// Public routes
safeRoute('post', '/register', register);
safeRoute('post', '/login', login);
safeRoute('post', '/forgot-password', forgotPassword);

// Private routes (require authentication)
safeRoute('get', '/me', protect, getMe);
safeRoute('put', '/reset-password', protect, resetPassword);
safeRoute('get', '/logout', protect, logout);

// Verify router is valid before exporting
console.log('Auth routes initialized with', router.stack.length, 'routes');

// Ensure we're always exporting a valid router
module.exports = router;
