const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');

module.exports = function(req, res, next) {
  // Get token from header
  const token = req.header('x-auth-token');
  
  // Check if no token
  if (!token) {
    return res.status(401).json({ 
      msg: 'No token, authorization denied',
      code: 'NO_TOKEN'
    });
  }
  
  // Verify token
  try {
    const decoded = jwt.verify(token, jwtConfig.secret);
    
    // Check if user is not an admin (regular user)
    if (decoded.user.role === 'admin' && decoded.user.id === 'admin') {
      return res.status(403).json({ 
        msg: 'Admins cannot access user routes',
        code: 'ADMIN_NOT_ALLOWED'
      });
    }
    
    req.user = decoded.user;
    next();
  } catch (err) {
    console.error('Token verification error:', err);
    res.status(401).json({ 
      msg: 'Token is not valid',
      code: 'INVALID_TOKEN',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};
