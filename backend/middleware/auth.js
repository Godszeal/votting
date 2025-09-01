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
    
    // Check if user is admin
    if (decoded.user.role !== 'admin' && decoded.user.id !== 'admin') {
      return res.status(403).json({ msg: 'User is not authorized' });
    }
    
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};
