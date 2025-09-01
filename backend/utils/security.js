const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// Generate a secure random token
exports.generateSecureToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

// Hash password
exports.hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
};

// Verify password
exports.verifyPassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

// Generate JWT
exports.generateToken = (payload, expiresIn = '30d') => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

// Verify JWT
exports.verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Generate 2FA secret
exports.generateTwoFactorSecret = () => {
  return crypto.randomBytes(20).toString('hex');
};

// Verify 2FA code
exports.verifyTwoFactorCode = (secret, code) => {
  // In a real implementation, you would use a library like speakeasy
  // For demo purposes, we'll just check if it's the expected code
  return code === '123456';
};

// Sanitize user input
exports.sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  // Remove potentially harmful characters
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/on\w+\s*=\s*"/gi, '')
    .trim();
};

// Generate audit log entry
exports.createAuditLog = (userId, action, details) => {
  return {
    userId,
    action,
    details,
    timestamp: new Date(),
    ip: details.ip,
    userAgent: details.userAgent
  };
};

// Check if password meets security requirements
exports.validatePassword = (password) => {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return errors;
};

// Generate unique vote ID with blockchain-like verification
exports.generateVoteId = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  const hash = crypto.createHash('sha256')
    .update(timestamp + random + process.env.JWT_SECRET)
    .digest('hex')
    .substr(0, 12);
    
  return `VOTE-${timestamp}-${hash}`;
};
