require('dotenv').config(); // Must be the very first line
const express = require('express');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const path = require('path');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const fileupload = require('express-fileupload');

// Validate environment variables before starting
const validateEnv = () => {
  const requiredVars = ['NODE_ENV'];
  
  if (process.env.NODE_ENV === 'production') {
    requiredVars.push('MONGO_URI');
  }
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
};

try {
  validateEnv();
} catch (error) {
  console.error(`Environment validation failed: ${error.message}`);
  process.exit(1);
}

// Function to safely require routes
const safeRequireRoutes = (routePath) => {
  try {
    const routes = require(routePath);
    
    // Verify it's a valid Express router
    if (routes && typeof routes === 'function' && routes.handle) {
      console.log(`Routes loaded successfully from ${routePath}`);
      return routes;
    } else {
      console.error(`Invalid routes from ${routePath}: not a valid Express router`);
      return null;
    }
  } catch (error) {
    console.error(`Failed to load routes from ${routePath}:`, error);
    return null;
  }
};

const app = express();

// Connect to database
connectDB()
  .then(() => {
    console.log('Database connected successfully');
    
    // Body parser
    app.use(express.json());

    // Cookie parser
    app.use(cookieParser());

    // Sanitize data
    app.use(mongoSanitize());

    // Set security headers
    app.use(helmet());

    // Prevent XSS attacks
    app.use(xss());

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 10 * 60 * 1000, // 10 mins
      max: 100
    });
    app.use(limiter);

    // Prevent http param pollution
    app.use(hpp());

    // Enable file upload
    app.use(fileupload());

    // Set static folder
    if (process.env.NODE_ENV === 'production') {
      app.use(express.static(path.join(__dirname, '../frontend/build')));
      
      app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, '../frontend', 'build', 'index.html'));
      });
    } else {
      app.get('/', (req, res) => {
        res.send(`
          <h1>Student Voting System API</h1>
          <p>Server is running in ${process.env.NODE_ENV} mode</p>
          <p>Environment variables loaded:</p>
          <ul>
            <li>NODE_ENV: ${process.env.NODE_ENV}</li>
            <li>MONGO_URI: ${process.env.MONGO_URI ? 'SET (masked)' : 'NOT SET'}</li>
            <li>MONGO_LOCAL: ${process.env.MONGO_LOCAL || 'Default used'}</li>
          </ul>
          <p>Routes status:</p>
          <ul>
            <li>Auth routes: /api/auth</li>
            <li>User routes: /api/users</li>
            <li>Admin routes: /api/admin</li>
          </ul>
        `);
      });
    }

    // Routes - with enhanced safety checks
    const authRoutes = safeRequireRoutes('./routes/authRoutes');
    const userRoutes = safeRequireRoutes('./routes/userRoutes');
    const adminRoutes = safeRequireRoutes('./routes/adminRoutes');

    // Only use routes if they're valid
    if (authRoutes) {
      app.use('/api/auth', authRoutes);
    } else {
      // Fallback route for auth
      app.use('/api/auth/*', (req, res) => {
        res.status(500).json({ 
          success: false, 
          error: 'Auth routes failed to load. Server configuration error.' 
        });
      });
    }

    if (userRoutes) {
      app.use('/api/users', userRoutes);
    } else {
      // Fallback route for users
      app.use('/api/users/*', (req, res) => {
        res.status(500).json({ 
          success: false, 
          error: 'User routes failed to load. Server configuration error.' 
        });
      });
    }

    if (adminRoutes) {
      app.use('/api/admin', adminRoutes);
    } else {
      // Fallback route for admin
      app.use('/api/admin/*', (req, res) => {
        res.status(500).json({ 
          success: false, 
          error: 'Admin routes failed to load. Server configuration error.' 
        });
      });
    }

    // Error handler
    app.use(errorHandler);

    const PORT = process.env.PORT || 5000;

    const server = app.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
      console.log('Server initialization complete');
      
      // Log all registered routes for debugging
      console.log('\nRegistered routes:');
      app._router.stack.forEach((middleware) => {
        if (middleware.route) {
          console.log(`  ${Object.keys(middleware.route.methods).join(', ').toUpperCase()} ${middleware.route.path}`);
        }
      });
      console.log('');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', err);
      // Close server & exit process
      server.close(() => {
        console.error('Server closed due to unhandled promise rejection');
        process.exit(1);
      });
    });
  })
  .catch(dbError => {
    console.error('Database connection failed:', dbError);
    process.exit(1);
  });
