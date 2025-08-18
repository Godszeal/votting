const jwt = require('jsonwebtoken');
const User = require('../models/User');
const jwtConfig = require('../config/jwt'); // Import our verified JWT config

const auth = async (req, res, next) => {
  try {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });

    // Use our verified JWT secret
    const decoded = jwt.verify(token, jwtConfig.secret);
    req.user = await User.findById(decoded.user.id).select('-password');
    
    if (!req.user) return res.status(401).json({ msg: 'User not found' });
    next();
  } catch (err) {
    console.error('JWT Verification Error:', err.message);
    res.status(401).json({ 
      msg: 'Token is not valid',
      error: err.message 
    });
  }
};

module.exports = auth;
