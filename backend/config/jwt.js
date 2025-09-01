const fs = require('fs');
const path = require('path');

// Check if JWT_SECRET is set
if (!process.env.JWT_SECRET) {
  // Try to load from .env if not set
  const possiblePaths = [
    path.join(__dirname, '../../.env'),
    path.join(__dirname, '../.env'),
    path.join(__dirname, '.env'),
    path.join(process.cwd(), '.env')
  ];
  
  let envFound = false;
  for (const envPath of possiblePaths) {
    if (fs.existsSync(envPath)) {
      require('dotenv').config({ path: envPath });
      envFound = true;
      break;
    }
  }
  
  // If still not set, check for a fallback file
  if (!process.env.JWT_SECRET) {
    const fallbackPath = path.join(__dirname, 'jwt_secret.txt');
    if (fs.existsSync(fallbackPath)) {
      process.env.JWT_SECRET = fs.readFileSync(fallbackPath, 'utf8').trim();
      console.log('✅ Loaded JWT_SECRET from jwt_secret.txt');
    }
  }
  
  // Final check
  if (!process.env.JWT_SECRET) {
    const errorMessage = `
❌ FATAL ERROR: JWT_SECRET is missing!

Please create a .env file in your project root directory with:
JWT_SECRET=your_strong_secret_key_here

Current working directory: ${process.cwd()}
Possible .env locations checked:
${possiblePaths.map(p => `  - ${p}`).join('\n')}

${envFound ? '✅ .env file found but JWT_SECRET not defined in it' : '❌ No .env file found'}

For production environments, set JWT_SECRET as a system environment variable.
`;
    
    console.error(errorMessage);
    
    // In production, this is a critical error
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET is required in production');
    } else {
      // For development, generate a temporary secret
      console.warn('⚠️ Generating temporary JWT_SECRET for development (INSECURE - CHANGE FOR PRODUCTION)');
      const crypto = require('crypto');
      process.env.JWT_SECRET = crypto.randomBytes(32).toString('hex');
      console.log(`✅ Generated temporary JWT_SECRET: ${process.env.JWT_SECRET}`);
    }
  }
}

module.exports = {
  secret: process.env.JWT_SECRET,
  expiresIn: process.env.JWT_EXPIRES_IN || '1h'
};
