const jwt = require('jsonwebtoken');
const User = require('../models/User');
const jwtConfig = require('../config/jwt');

const auth = async (req, res, next) => {
  try {
    const token = req.header('x-auth-token');
    if (!token) {
      return res.status(401).json({ 
        message: 'No token, authorization denied',
        hasToken: false
      });
    }
    
    let decoded;
    try {
      decoded = jwt.verify(token, jwtConfig.secret);
    } catch (err) {
      return res.status(401).json({ 
        message: 'Token is not valid',
        error: err.message,
        token: token.substring(0, 20) + '...'
      });
    }
    
    // Handle special admin case
    if (decoded.user && decoded.user.id === 'admin') {
      req.user = {
        id: 'admin',
        role: 'admin',
        isAdmin: true
      };
      return next();
    }
    
    // Regular user case
    if (!decoded.user || !decoded.user.id) {
      return res.status(401).json({ 
        message: 'Invalid token structure',
        decoded: decoded
      });
    }
    
    req.user = await User.findById(decoded.user.id).select('-password');
    
    if (!req.user) {
      return res.status(401).json({ 
        message: 'User not found',
        userId: decoded.user.id
      });
    }
    
    next();
  } catch (err) {
    console.error('Authentication error:', err);
    res.status(500).json({ 
      message: 'Server error during authentication',
      error: err.message 
    });
  }
};

module.exports = auth;
