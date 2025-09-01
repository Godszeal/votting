const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Try to find .env file in multiple locations
const findEnvFile = () => {
  // Check common locations
  const possiblePaths = [
    path.join(__dirname, '../../.env'),  // Project root (most common)
    path.join(__dirname, '../.env'),     // Backend directory
    path.join(__dirname, '.env'),        // Config directory
    path.join(process.cwd(), '.env')     // Current working directory
  ];
  
  for (const envPath of possiblePaths) {
    if (fs.existsSync(envPath)) {
      console.log(`✅ Found .env file at: ${envPath}`);
      return envPath;
    }
  }
  
  console.error('❌ Could not find .env file in any standard location');
  console.error('Common locations checked:');
  possiblePaths.forEach(p => console.error(`  - ${p}`));
  
  // In production, we must have environment variables
  if (process.env.NODE_ENV === 'production') {
    console.error('🚨 ERROR: In production, you MUST set environment variables directly (not via .env file)');
    console.error('Set these environment variables in your hosting platform:');
    console.error('  MONGODB_URI, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD, BASE_URL');
    throw new Error('Missing required environment variables in production');
  }
  
  // For development, create a warning but continue
  console.warn('⚠️ Running in development mode without .env file');
  return null;
};

// Load environment variables
const envPath = findEnvFile();
if (envPath) {
  dotenv.config({ path: envPath });
} else {
  // Try to load from process.env directly (for production)
  console.log('ℹ️ Loading environment variables from system environment');
}

// Validate required environment variables
const validateEnvVars = () => {
  const requiredVars = ['MONGODB_URI', 'JWT_SECRET', 'ADMIN_EMAIL', 'ADMIN_PASSWORD', 'BASE_URL'];
  const missingVars = [];
  
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  });
  
  if (missingVars.length > 0) {
    console.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
    
    if (process.env.NODE_ENV === 'production') {
      console.error('🚨 ERROR: In production, you MUST set these environment variables:');
      missingVars.forEach(varName => {
        console.error(`  - ${varName}`);
      });
      throw new Error('Missing required environment variables');
    } else {
      console.warn('⚠️ Running in development mode with missing environment variables');
      
      // Provide development defaults
      if (missingVars.includes('MONGODB_URI')) {
        process.env.MONGODB_URI = 'mongodb://localhost:27017/votesphere';
        console.log('ℹ️ Using default MONGODB_URI for development: mongodb://localhost:27017/votesphere');
      }
      
      if (missingVars.includes('JWT_SECRET')) {
        process.env.JWT_SECRET = 'a3f8c1d4e5b6a7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2';
        console.log('ℹ️ Using default JWT_SECRET for development (INSECURE - CHANGE FOR PRODUCTION)');
      }
      
      if (missingVars.includes('ADMIN_EMAIL')) {
        process.env.ADMIN_EMAIL = 'admin@example.com';
        console.log('ℹ️ Using default ADMIN_EMAIL for development: admin@example.com');
      }
      
      if (missingVars.includes('ADMIN_PASSWORD')) {
        process.env.ADMIN_PASSWORD = 'admin123';
        console.log('ℹ️ Using default ADMIN_PASSWORD for development: admin123 (INSECURE - CHANGE FOR PRODUCTION)');
      }
      
      if (missingVars.includes('BASE_URL')) {
        process.env.BASE_URL = 'http://localhost:3000';
        console.log('ℹ️ Using default BASE_URL for development: http://localhost:3000');
      }
    }
  }
};

const connectDB = async () => {
  try {
    // Validate environment variables first
    validateEnvVars();
    
    // Get MongoDB URI
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      throw new Error('MongoDB URI is not defined after validation');
    }
    
    console.log(`Attempting to connect to MongoDB at: ${mongoURI.replace(/\/\/(.*):(.*)@/, '//[hidden]:[hidden]@')}`);
    
    // Set mongoose options - REMOVED useCreateIndex as it's no longer supported in Mongoose 6+
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      connectTimeoutMS: 30000,
      serverSelectionTimeoutMS: 30000
    };
    
    // Connect to MongoDB
    const conn = await mongoose.connect(mongoURI, options);
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Add connection event listeners
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });
    
    // Handle process termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('🔌 MongoDB connection closed through app termination');
      process.exit(0);
    });
    
    return conn;
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err);
    
    // Provide more specific error messages
    if (err.name === 'MongoParseError') {
      console.error('The MongoDB URI format is incorrect. It should look like:');
      console.error('mongodb://username:password@host:port/database');
    } else if (err.name === 'MongoNetworkError' || err.message.includes('ECONNREFUSED')) {
      console.error('Cannot connect to MongoDB server. Make sure MongoDB is running.');
      console.error('Try starting MongoDB with: mongod');
    } else if (err.message.includes('usecreateindex')) {
      console.error('The "useCreateIndex" option is no longer supported in Mongoose 6+. It has been removed from connection options.');
    }
    
    // Don't throw in development to allow server to start
    if (process.env.NODE_ENV !== 'production') {
      console.warn('⚠️ Continuing in development mode without database connection');
      return null;
    }
    
    throw err;
  }
};

module.exports = connectDB;
