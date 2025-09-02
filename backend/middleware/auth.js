const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');

module.exports = function(req, res, next) {
  // Get token from header
  const token = req.header('x-auth-token');
  
  // Check if no token
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }
  
  // Verify token
  try {
    const decoded = jwt.verify(token, jwtConfig.secret);
    
    // Add user to request object
    req.user = decoded.user;
    
    // Log for debugging
    console.log('Token verified for user:', req.user.id);
    
    next();
  } catch (err) {
    console.error('Token verification error:', err);
    res.status(401).json({ msg: 'Token is not valid' });
  }
};
