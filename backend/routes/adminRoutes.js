const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');

// Use dynamic import pattern to avoid circular dependencies
let adminController;
try {
  adminController = require('../controllers/adminController');
  console.log('\n✅ Admin controller loaded successfully');
} catch (error) {
  console.error('❌ Failed to load adminController:', error);
  // Create fallback functions to prevent server crash
  adminController = {
    createElection: (req, res) => res.status(500).json({ 
      success: false, 
      error: 'Admin controller failed to load. Check server logs.' 
    }),
    getAllElections: (req, res) => res.status(500).json({ 
      success: false, 
      error: 'Admin controller failed to load. Check server logs.' 
    }),
    getElection: (req, res) => res.status(500).json({ 
      success: false, 
      error: 'Admin controller failed to load. Check server logs.' 
    }),
    updateElection: (req, res) => res.status(500).json({ 
      success: false, 
      error: 'Admin controller failed to load. Check server logs.' 
    }),
    deleteElection: (req, res) => res.status(500).json({ 
      success: false, 
      error: 'Admin controller failed to load. Check server logs.' 
    }),
    endElection: (req, res) => res.status(500).json({ 
      success: false, 
      error: 'Admin controller failed to load. Check server logs.' 
    }),
    getElectionResults: (req, res) => res.status(500).json({ 
      success: false, 
      error: 'Admin controller failed to load. Check server logs.' 
    }),
    manageUsers: (req, res) => res.status(500).json({ 
      success: false, 
      error: 'Admin controller failed to load. Check server logs.' 
    }),
    getUserDetails: (req, res) => res.status(500).json({ 
      success: false, 
      error: 'Admin controller failed to load. Check server logs.' 
    }),
    updateUserRole: (req, res) => res.status(500).json({ 
      success: false, 
      error: 'Admin controller failed to load. Check server logs.' 
    })
  };
}

// Verify all controller functions exist before defining routes
const verifyController = (funcName) => {
  if (typeof adminController[funcName] !== 'function') {
    console.error(`❌ Controller function ${funcName} is not defined or not a function`);
    return false;
  }
  console.log(`✓ Controller function ${funcName} is valid`);
  return true;
};

// Helper function to safely define routes
const safeRoute = (method, path, ...middlewares) => {
  // Remove any undefined middleware functions
  const validMiddlewares = middlewares.filter(mw => typeof mw === 'function');
  
  if (validMiddlewares.length === 0) {
    console.error(`❌ No valid middleware functions for ${method.toUpperCase()} ${path}`);
    return;
  }
  
  // Define the route with the valid middleware chain
  router[method](path, ...validMiddlewares);
  console.log(`✓ Defined ${method.toUpperCase()} ${path} with ${validMiddlewares.length} middleware`);
};

// Define routes with verification
if (verifyController('createElection')) {
  safeRoute('post', '/elections', protect, admin, adminController.createElection);
}

if (verifyController('getAllElections')) {
  safeRoute('get', '/elections', protect, admin, adminController.getAllElections);
}

if (verifyController('getElection')) {
  safeRoute('get', '/elections/:id', protect, admin, adminController.getElection);
}

if (verifyController('updateElection')) {
  safeRoute('put', '/elections/:id', protect, admin, adminController.updateElection);
}

if (verifyController('deleteElection')) {
  safeRoute('delete', '/elections/:id', protect, admin, adminController.deleteElection);
}

if (verifyController('endElection')) {
  safeRoute('post', '/elections/:id/end', protect, admin, adminController.endElection);
}

if (verifyController('getElectionResults')) {
  safeRoute('get', '/elections/:id/results', protect, admin, adminController.getElectionResults);
}

if (verifyController('manageUsers')) {
  safeRoute('get', '/users', protect, admin, adminController.manageUsers);
}

if (verifyController('getUserDetails')) {
  safeRoute('get', '/users/:id', protect, admin, adminController.getUserDetails);
}

if (verifyController('updateUserRole')) {
  safeRoute('put', '/users/:id/role', protect, admin, adminController.updateUserRole);
}

// Verify router is valid before exporting
console.log(`\n📦 Admin routes initialized with ${router.stack.length} routes`);

// Ensure we're always exporting a valid router
console.log('✅ Admin routes module ready for export');
module.exports = router;
