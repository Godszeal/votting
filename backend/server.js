const express = require('express');
const connectDB = require('./config/db');
const path = require('path');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
// 🕒 Keep-Alive Cron Script
const cron = require('node-cron');
const axios = require('axios');
const ora = require('ora');
const c = require('chalk');
const selfPingUrl = process.env.SELF_PING_URL || `http://localhost:${PORT}`;

cron.schedule('* * * * *', async () => {
  const spinner = ora({
    text: c.cyan(`🔁 Pinging self to keep app awake...`),
    spinner: 'dots'
  }).start();

  try {
    await axios.get(selfPingUrl);
    spinner.succeed(c.green(`✅ Self-ping successful at ${new Date().toLocaleTimeString()}`));
  } catch (err) {
    spinner.fail(c.red(`⚠️ Self-ping failed at ${new Date().toLocaleTimeString()}: ${err.message}`));
  }
});

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '.env') });

// Connect to database
const dbConnection = connectDB();

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

// Handle database connection errors
if (dbConnection && typeof dbConnection.catch === 'function') {
  dbConnection.catch(err => {
    console.error('Database connection failed:', err);
  });
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`\n🚀 Server started on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Only show DB connection status if we have a valid connection
  if (process.env.MONGODB_URI) {
    const maskedURI = process.env.MONGODB_URI.replace(/\/\/(.*):(.*)@/, '//[hidden]:[hidden]@');
    console.log(`🗄️  Database: ${maskedURI}`);
  }
  
  console.log('✅ Server is ready to handle requests\n');
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  // Don't exit the process, keep the server running
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled Promise Rejection:', error);
  // Don't exit the process, keep the server running
});

// Health check endpoint
app.get('/health', (req, res) => {
  const healthStatus = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: process.env.MONGODB_URI ? 'connected' : 'not connected'
  };
  
  // Check if we're in development and don't have a DB connection
  if (process.env.NODE_ENV === 'development' && !process.env.MONGODB_URI) {
    healthStatus.warning = 'Running in development mode without database connection';
  }
  
  res.json(healthStatus);
});
