const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables from multiple possible locations
const loadEnvironment = () => {
  // Define possible .env file locations
  const possibleEnvPaths = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '.env.local'),
    path.resolve(__dirname, '../.env'),
    path.resolve(__dirname, '../../.env'),
    path.resolve(process.cwd(), '../.env')
  ];
  
  let envLoaded = false;
  
  // Try each location
  for (const envPath of possibleEnvPaths) {
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath });
      console.log(`✓ Environment variables loaded from: ${envPath}`);
      envLoaded = true;
      break;
    }
  }
  
  // If no .env file found, check if variables are set in system
  if (!envLoaded) {
    console.warn('⚠️ Warning: .env file not found in standard locations');
    
    // Check if MONGODB_URI is at least set in system environment
    if (!process.env.MONGODB_URI) {
      console.error('✗ Critical Error: MONGODB_URI is not defined!');
      console.error('\nPlease create a .env file with these required variables:');
      console.error(`
MONGODB_URI=mongodb://localhost:27017/votesphere
JWT_SECRET=your_strong_secret_here
JWT_EXPIRES_IN=1h
ADMIN_EMAIL=babalolahephzibah2@gmail.com
ADMIN_PASSWORD=Godszeal
BASE_URL=http://localhost:3000
PORT=5000
      `);
      
      // Exit with specific error code for missing env variables
      process.exit(10);
    } else {
      console.log('✓ Environment variables found in system environment');
    }
  }
};

// Call the environment loader
loadEnvironment();

const connectDB = async () => {
  try {
    // Verify MONGODB_URI is defined
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined. Please check your environment configuration.');
    }
    
    // Mask credentials for safe logging
    const maskedURI = process.env.MONGODB_URI.replace(/\/\/(.*):(.*)@/, '//****:****@');
    console.log(`Attempting to connect to MongoDB: ${maskedURI}`);
    
    // Add connection options for better reliability
    const connectionOptions = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      connectTimeoutMS: 10000,     // 10 seconds
      socketTimeoutMS: 45000,      // 45 seconds
      serverSelectionTimeoutMS: 5000, // 5 seconds
      family: 4                    // Use IPv4, skip trying IPv6
    };
    
    // Connect to MongoDB
    const conn = await mongoose.connect(process.env.MONGODB_URI, connectionOptions);
    
    console.log(`✓ MongoDB Connected: ${conn.connection.host}`);
    
    // Add connection event listeners for better error handling
    mongoose.connection.on('error', (err) => {
      console.error('✗ MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected. Attempting to reconnect...');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('✓ MongoDB reconnected successfully');
    });
    
    return conn;
  } catch (err) {
    console.error(`✗ MongoDB Connection Failed: ${err.message}`);
    
    // Provide specific guidance based on error type
    if (err.name === 'MongoParseError') {
      console.error('Possible issue: Invalid MongoDB connection string format');
      console.error('Make sure your MONGODB_URI follows the format: mongodb://username:password@host:port/database');
    } else if (err.name === 'MongoNetworkError') {
      console.error('Possible issue: Could not connect to MongoDB server');
      console.error('Is MongoDB running? Try starting it with:');
      console.error('  - Linux: sudo service mongod start');
      console.error('  - Windows: Start the "MongoDB" service');
      console.error('  - macOS: brew services start mongodb-community');
    } else if (err.code === 'ENOTFOUND') {
      console.error('Possible issue: Could not resolve hostname in connection string');
    }
    
    console.error('\nTroubleshooting steps:');
    console.error('1. Verify MongoDB is installed and running on your system');
    console.error('2. Check if you can connect to MongoDB using a GUI tool like MongoDB Compass');
    console.error('3. If using a cloud MongoDB service, verify your IP is whitelisted');
    console.error('4. Ensure your .env file exists in the project root with correct values');
    
    // Exit with specific error code for connection failure
    process.exit(1);
  }
};

module.exports = connectDB;
