const express = require('express');
const connectDB = require('./config/db');
const path = require('path');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(express.json({ extended: false }));
app.use(cookieParser());

// Define Routes
let authRoutes, userRoutes, adminRoutes, votingRoutes;

// Helper function to safely load routes
const loadRoutes = (routePath, routeName) => {
  try {
    console.log(`Loading ${routeName} routes...`);
    const routes = require(routePath);
    console.log(`${routeName} routes loaded successfully`);
    return routes;
  } catch (err) {
    console.error(`Error loading ${routeName} routes:`, err);
    const router = express.Router();
    router.use((req, res) => {
      res.status(500).json({ 
        message: `Service unavailable: ${routeName} routes failed to load`,
        error: err.message
      });
    });
    return router;
  }
};

authRoutes = loadRoutes('./routes/auth', 'auth');
userRoutes = loadRoutes('./routes/user', 'user');
adminRoutes = loadRoutes('./routes/admin', 'admin');
votingRoutes = loadRoutes('./routes/voting', 'voting');

// Register routes - CORRECT ORDER
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/voting', votingRoutes);

// Voting page route - must come before static files
app.use('/voting', votingRoutes);

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static('public'));
  
  // Serve index.html for all other routes EXCEPT voting links
  app.get('*', (req, res) => {
    // CRITICAL FIX: Don't interfere with voting links
    if (req.path.startsWith('/voting/')) {
      return next();
    }
    
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

// CRITICAL FIX: Add error handling for file not found
app.use((err, req, res, next) => {
  if (err.code === 'ENOENT') {
    console.error('File not found:', err.path);
    // If it's a voting path issue, redirect to home
    if (req.path.includes('/voting/') && req.path.includes('user-dashboard')) {
      return res.redirect('/');
    }
    return res.status(404).send('File not found');
  }
  next(err);
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
  console.log('Server is ready to handle requests');
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Don't exit the process, keep the server running
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error('Unhandled Promise Rejection:', error);
  // Don't exit the process, keep the server running
});
