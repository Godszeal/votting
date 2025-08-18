// THIS MUST BE THE VERY FIRST LINE
require('dotenv').config({
  path: __dirname + '/.env'
});

// Verify critical environment variables
if (!process.env.JWT_SECRET) {
  console.error('\n\n❌ CRITICAL ERROR: JWT_SECRET is not loaded!');
  console.error('Please check:');
  console.error('1. You have a .env file in the backend directory');
  console.error('2. The .env file contains JWT_SECRET=your_key_here');
  console.error('3. The file path is correct: ' + __dirname + '/.env');
  console.error('4. You restarted the server after making changes\n\n');
  process.exit(1);
}

if (!process.env.MONGO_URI) {
  console.error('\n\n❌ CRITICAL ERROR: MONGO_URI is not loaded!');
  console.error('Please check your .env file contains MONGO_URI=mongodb://localhost:27017/student_voting\n\n');
  process.exit(1);
}

const express = require('express');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/admin');
const path = require('path');

// Verify environment variables
console.log('✅ Environment verification:');
console.log(`   MONGO_URI: ${process.env.MONGO_URI ? 'SET' : 'NOT SET'}`);
console.log(`   JWT_SECRET: ${process.env.JWT_SECRET ? `[${process.env.JWT_SECRET.length} characters]` : 'NOT SET'}`);
console.log(`   ADMIN_EMAIL: ${process.env.ADMIN_EMAIL ? 'SET' : 'NOT SET'}`);
console.log(`   ADMIN_PASSWORD: ${process.env.ADMIN_PASSWORD ? 'SET' : 'NOT SET'}`);

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Serve HTML files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'login.html'));
});

app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'signup.html'));
});

app.get('/user-dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'user-dashboard.html'));
});

app.get('/admin-login', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'admin-login.html'));
});

app.get('/admin-dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'admin-dashboard.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n✅ Server started on port ${PORT}`);
  console.log('🚀 Student Voting System is ready!');
  console.log('----------------------------------------');
  console.log('Access:');
  console.log('  Student Portal: http://localhost:5000');
  console.log('  Admin Login: http://localhost:5000/admin-login.html');
  console.log('  Admin Credentials:');
  console.log('    Email: babalolahephzibah2@gmail.com');
  console.log('    Password: Godszeal');
  console.log('----------------------------------------\n');
});
