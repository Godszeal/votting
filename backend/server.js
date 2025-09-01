const express = require('express');
const connectDB = require('./config/db');
const path = require('path');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');

// Load environment variables early
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Connect to database first
let dbConnection;
try {
  // We need to properly handle the async connection
  dbConnection = connectDB();
} catch (err) {
  console.error('Database connection setup failed:', err);
  // The db.js file already exits on critical errors, but this is a safeguard
  process.exit(1);
}

// Create express app after ensuring DB connection is being established
const app = express();

// Middleware
app.use(express.json({ extended: false }));
app.use(cookieParser());

// Define Routes with error handling
let authRoutes, userRoutes, adminRoutes;

try {
  authRoutes = require('./routes/auth');
} catch (err) {
  console.error('Error loading auth routes:', err);
  authRoutes = express.Router();
  authRoutes.use((req, res) => {
    res.status(500).json({ 
      message: 'Service unavailable', 
      error: 'Auth routes loading error'
    });
  });
}

try {
  userRoutes = require('./routes/user');
} catch (err) {
  console.error('Error loading user routes:', err);
  userRoutes = express.Router();
  userRoutes.use((req, res) => {
    res.status(500).json({ 
      message: 'Service unavailable', 
      error: 'User routes loading error'
    });
  });
}

try {
  adminRoutes = require('./routes/admin');
} catch (err) {
  console.error('Error loading admin routes:', err);
  adminRoutes = express.Router();
  adminRoutes.use((req, res) => {
    res.status(500).json({ 
      message: 'Service unavailable', 
      error: 'Admin routes loading error'
    });
  });
}

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static('public'));
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
  });
} else {
  // Set static folder
  app.use(express.static(path.join(__dirname, 'public')));
  
  // API test route
  app.get('/api', (req, res) => {
    res.json({ message: 'API is running' });
  });
}

const PORT = process.env.PORT || 5000;

// Start server only after DB connection is successful
dbConnection.then(() => {
  const server = app.listen(PORT, () => {
    console.log(`✓ Server started on port ${PORT}`);
    console.log('✓ Server is ready to handle requests');
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\nStopping server...');
      server.close(() => {
        console.log('✓ Server stopped');
        mongoose.connection.close(false, () => {
          console.log('✓ MongoDB connection closed');
          process.exit(0);
        });
      });
    });
  });
}).catch(err => {
  console.error('Failed to establish database connection:', err);
  // This shouldn't happen as connectDB() already exits on error
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('✗ Uncaught Exception:', error);
  // Exit with specific error code
  process.exit(128);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error('✗ Unhandled Promise Rejection:', error);
});
