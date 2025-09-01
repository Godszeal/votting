const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const RedisStore = require('rate-limit-redis');
const redis = require('redis');

// Create Redis client for production
let redisClient;
if (process.env.REDIS_URL) {
  redisClient = redis.createClient({
    url: process.env.REDIS_URL,
    legacyMode: true
  });
  redisClient.connect().catch(console.error);
}

// API request rate limiter
exports.apiLimiter = rateLimit({
  store: redisClient ? new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(...args)
  }) : undefined,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: (req, res) => {
    return {
      success: false,
      error: 'Too many requests, please try again later.',
      resetTime: new Date(Date.now() + 15 * 60 * 1000).toISOString()
    };
  },
  skip: (req, res) => {
    // Skip rate limiting for development
    return process.env.NODE_ENV === 'development';
  }
});

// Auth specific rate limiter (stricter)
exports.authLimiter = rateLimit({
  store: redisClient ? new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(...args)
  }) : undefined,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: (req, res) => {
    return {
      success: false,
      error: 'Too many login attempts, please try again later.',
      resetTime: new Date(Date.now() + 15 * 60 * 1000).toISOString()
    };
  },
  skip: (req, res) => {
    // Skip rate limiting for development
    return process.env.NODE_ENV === 'development';
  },
  handler: (req, res, next, options) => {
    // Lock user account after 5 failed attempts
    if (req.body.matricNumber) {
      User.findOne({ matricNumber: req.body.matricNumber })
        .then(user => {
          if (user) {
            user.lockUntil = Date.now() + 30 * 60 * 1000; // Lock for 30 minutes
            return user.save();
          }
        })
        .catch(console.error);
    }
    
    return res.status(options.statusCode).json(options.message(req, res));
  }
});

// Slow down responses after multiple requests
exports.slowDown = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // Begin slowing down responses after the 50th request
  delayMs: (requests) => {
    // Slow down subsequent requests by 500ms per request
    return (requests - 50) * 500;
  }
});
