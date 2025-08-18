// THIS FILE MUST BE LOADED BEFORE ANY JWT OPERATIONS
require('dotenv').config({
  path: __dirname + '/../.env'
});

// Verify JWT_SECRET exists
if (!process.env.JWT_SECRET) {
  throw new Error(
    '\n\n❌ FATAL ERROR: JWT_SECRET is missing!\n' +
    'Please create a .env file in your backend directory with:\n' +
    'JWT_SECRET=your_strong_secret_key_here\n\n' +
    'Current .env path: ' + __dirname + '/../.env\n' +
    'Files in directory: ' + require('fs').readdirSync(__dirname + '/..').join(', ')
  );
}

// Export the verified secret
module.exports = {
  secret: process.env.JWT_SECRET,
  expiresIn: '5d'
};

console.log('🔐 JWT configuration loaded successfully (' + process.env.JWT_SECRET.length + ' characters)');
