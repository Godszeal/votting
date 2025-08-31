require('dotenv').config(); // Ensure this is at the very top
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Get environment variables
    const MONGO_URI = process.env.MONGO_URI;
    const MONGO_LOCAL = process.env.MONGO_LOCAL || 'mongodb://localhost:27017/studentvoting';
    const NODE_ENV = process.env.NODE_ENV || 'development';
    
    // Validate required environment variables
    if (NODE_ENV === 'production' && !MONGO_URI) {
      throw new Error('MONGO_URI is required in production environment. Please set it in your Render dashboard.');
    }
    
    // Determine which URI to use
    const uri = NODE_ENV === 'production' ? MONGO_URI : MONGO_LOCAL;
    
    // Log connection attempt (but mask sensitive info)
    console.log(`Attempting to connect to MongoDB in ${NODE_ENV} mode`);
    if (NODE_ENV === 'production') {
      console.log('Using production MongoDB URI (masked)');
    } else {
      console.log(`Using local MongoDB: ${MONGO_LOCAL.replace(/:(.*)@/, ':*****@')}`);
    }
    
    // Connect to MongoDB
    const conn = await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Database connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
