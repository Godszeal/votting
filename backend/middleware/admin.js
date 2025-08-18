const auth = require('./auth');

const admin = async (req, res, next) => {
  // First run the regular auth middleware
  await auth(req, res, async () => {
    try {
      // Check if user is authenticated and is an admin
      if (req.user && (req.user.role === 'admin' || req.user.id === 'admin')) {
        return next();
      }
      
      // Special case for admin login endpoint
      if (req.path === '/api/auth/admin-login' && req.method === 'POST') {
        return next();
      }
      
      // If we get here, the user is not authorized
      return res.status(403).json({ 
        message: 'Admin access required',
        role: req.user ? req.user.role : 'not authenticated',
        userId: req.user ? req.user.id : 'none'
      });
    } catch (err) {
      console.error('Admin middleware error:', err);
      return res.status(500).json({ 
        message: 'Server error in admin middleware',
        error: err.message 
      });
    }
  });
};

module.exports = admin;
