// File: src/middleware/rateLimiter.js
// Generated: 2025-10-08 14:26:33 UTC
// Project ID: proj_5fc90398e8e7
// Task ID: task_fpzc51pb3gm3


const RedisStore = require('rate-limit-redis');


const config = require('../config/env');


const rateLimit = require('express-rate-limit');


const redis = require('redis');

// Create Redis client for rate limiting store


const redisClient = redis.createClient({
  url: config.redis?.url || process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 50, 500)
  }
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error for Rate Limiting:', err);
});

redisClient.connect().catch(console.error);

// IP identification strategy that works behind proxies


const keyGenerator = (req) => {
  // Trust proxy headers in order of preference
  return req.ip ||
         req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
         req.headers['x-real-ip'] ||
         req.connection?.remoteAddress ||
         req.socket?.remoteAddress ||
         'unknown';
};

// Skip function for non-critical requests


const skip = (req) => {
  // Skip rate limiting for health checks and monitoring endpoints
  const skipPaths = ['/health', '/metrics', '/ping', '/status'];
  return skipPaths.some(path => req.path.startsWith(path));
};

/**
 * Rate limiter middleware
 * Limits repeated requests to API endpoints
 */


const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:general:'
  }),
  keyGenerator,
  skip,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Too many requests from this IP, please try again later'
    });
  }
});

/**
 * Strict rate limiter for sensitive endpoints (auth, password reset, etc.)
 */


const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: {
    success: false,
    error: 'Too many attempts, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:strict:'
  }),
  keyGenerator,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Too many attempts, please try again later'
    });
  }
});

module.exports = {
  limiter,
  strictLimiter,
  redisClient
};
