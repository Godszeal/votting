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

// Function to safely require routes with detailed diagnostics
const safeRequireRoutes = (routePath) => {
  try {
    console.log(`\nAttempting to load routes from ${routePath}...`);
    
    // Clear require cache to avoid stale modules
    const modulePath = require.resolve(routePath);
    delete require.cache[modulePath];
    
    const routes = require(routePath);
    
    console.log(`Loaded routes from ${routePath}:`, {
      type: typeof routes,
      isFunction: typeof routes === 'function',
      hasHandle: routes && typeof routes.handle === 'function',
      stackLength: routes && routes.stack ? routes.stack.length : 'N/A',
      routePath: routePath
    });
    
    // Verify it's a valid Express router
    if (routes && typeof routes === 'function' && routes.handle) {
      console.log(`✓ Routes loaded successfully from ${routePath}`);
      return routes;
    } else {
      console.error(`✗ Invalid routes from ${routePath}: not a valid Express router`);
      
      // Detailed diagnostics
      console.log('Route object details:');
      console.log('typeof routes:', typeof routes);
      console.log('routes is function:', typeof routes === 'function');
      console.log('routes has handle:', routes && typeof routes.handle === 'function');
      console.log('routes stack length:', routes && routes.stack ? routes.stack.length : 'N/A');
      
      if (routes && typeof routes !== 'function') {
        console.log('routes contents:', JSON.stringify(routes, null, 2));
      }
      
      return null;
    }
  } catch (error) {
    console.error(`✗ Failed to load routes from ${routePath}:`, error);
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

    // Routes - with enhanced safety checks and diagnostics
    const authRoutes = safeRequireRoutes('./routes/authRoutes');
    const userRoutes = safeRequireRoutes('./routes/userRoutes');
    const adminRoutes = safeRequireRoutes('./routes/adminRoutes');

    // Function to safely use routes with detailed diagnostics
    const safeUseRoutes = (path, routes) => {
      if (!routes) {
        console.error(`Cannot use routes for ${path}: routes are null or undefined`);
        return false;
      }
      
      console.log(`\nAttempting to use routes for ${path}:`, {
        type: typeof routes,
        isFunction: typeof routes === 'function',
        hasHandle: routes && typeof routes.handle === 'function',
        stackLength: routes && routes.stack ? routes.stack.length : 'N/A'
      });
      
      try {
        app.use(path, routes);
        console.log(`✓ Successfully mounted routes at ${path}`);
        return true;
      } catch (error) {
        console.error(`✗ Failed to mount routes at ${path}:`, error);
        
        // Detailed diagnostics
        console.log('Route object details at mount time:');
        console.log('typeof routes:', typeof routes);
        console.log('routes is function:', typeof routes === 'function');
        console.log('routes has handle:', routes && typeof routes.handle === 'function');
        console.log('routes stack length:', routes && routes.stack ? routes.stack.length : 'N/A');
        
        if (routes && typeof routes !== 'function') {
          try {
            console.log('routes contents:', JSON.stringify(routes, null, 2));
          } catch (e) {
            console.log('Could not stringify routes object');
          }
        }
        
        return false;
      }
    };

    // Only use routes if they're valid
    let allRoutesLoaded = true;
    
    if (authRoutes) {
      if (!safeUseRoutes('/api/auth', authRoutes)) {
        allRoutesLoaded = false;
      }
    } else {
      allRoutesLoaded = false;
      // Fallback route for auth
      app.use('/api/auth/*', (req, res) => {
        res.status(500).json({ 
          success: false, 
          error: 'Auth routes failed to load. Server configuration error.' 
        });
      });
      console.log('✓ Set up fallback routes for /api/auth/*');
    }

    if (userRoutes) {
      if (!safeUseRoutes('/api/users', userRoutes)) {
        allRoutesLoaded = false;
      }
    } else {
      allRoutesLoaded = false;
      // Fallback route for users
      app.use('/api/users/*', (req, res) => {
        res.status(500).json({ 
          success: false, 
          error: 'User routes failed to load. Server configuration error.' 
        });
      });
      console.log('✓ Set up fallback routes for /api/users/*');
    }

    if (adminRoutes) {
      if (!safeUseRoutes('/api/admin', adminRoutes)) {
        allRoutesLoaded = false;
      }
    } else {
      allRoutesLoaded = false;
      // Fallback route for admin
      app.use('/api/admin/*', (req, res) => {
        res.status(500).json({ 
          success: false, 
          error: 'Admin routes failed to load. Server configuration error.' 
        });
      });
      console.log('✓ Set up fallback routes for /api/admin/*');
    }

    if (!allRoutesLoaded) {
      console.warn('⚠️ Warning: Not all routes were successfully loaded');
    }

    // Error handler
   // app.use(errorHandler);

    const PORT = process.env.PORT || 5000;

    const server = app.listen(PORT, () => {
      console.log(`\n✅ Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
      console.log('Server initialization complete');
      
      // Log all registered routes for debugging
      console.log('\n📋 Registered routes:');
      app._router.stack.forEach((middleware) => {
        if (middleware.route) {
          const methods = Object.keys(middleware.route.methods)
            .map(method => method.toUpperCase())
            .join(', ');
          console.log(`  ${methods} ${middleware.route.path}`);
        }
      });
      console.log('');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err, promise) => {
      console.error('\n🔥 Unhandled Rejection at:', promise, 'reason:', err);
      // Close server & exit process
      server.close(() => {
        console.error('🛑 Server closed due to unhandled promise rejection');
        process.exit(1);
      });
    });
  })
  .catch(dbError => {
    console.error('\n❌ Database connection failed:', dbError);
    process.exit(1);
  });
