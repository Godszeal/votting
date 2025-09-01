const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../.env') });

// Validate required environment variables
const validateEnvVars = () => {
  const requiredVars = ['MONGODB_URI'];
  const missingVars = [];
  
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  });
  
  if (missingVars.length > 0) {
    console.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
    console.error('Please create a .env file with these variables or set them in your environment');
    console.error('Example .env file content:');
    console.error('MONGODB_URI=mongodb+srv://godwinhephzibah25_db_user:Ku66Sbbtcb8sIwbJ@cluster0.v4tzdiq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0');
    console.error('JWT_SECRET=your_strong_secret_here');
    console.error('JWT_EXPIRES_IN=1h');
    console.error('ADMIN_EMAIL=babalolahephzibah2@gmail.com');
    console.error('ADMIN_PASSWORD=Godszeal');
    console.error('BASE_URL=http://localhost:3000');
    
    // Don't throw here, just log and provide fallback for development
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ Using fallback MongoDB URI for development only!');
      process.env.MONGODB_URI = 'mongodb://localhost:27017/votesphere';
    } else {
      throw new Error('Missing required environment variables');
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
      // useCreateIndex: true,  // REMOVED - no longer supported in Mongoose 6+
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
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ Continuing in development mode without database connection');
      return null;
    }
    
    throw err;
  }
};

module.exports = connectDB;
