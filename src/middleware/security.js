// File: src/middleware/security.js
// Generated: 2025-10-08 14:27:24 UTC
// Project ID: proj_5fc90398e8e7
// Task ID: task_s372xxm5ymnr


const config = require('../config/env');


const cors = require('cors');


const helmet = require('helmet');


const hpp = require('hpp');


const mongoSanitize = require('express-mongo-sanitize');


const rateLimit = require('express-rate-limit');


const xss = require('xss-clean');

/**
 * Configure security middleware
 * @param {Object} app - Express application instance
 */


const setupSecurity = (app) => {
  // Helmet - Set security headers (always enabled)
  app.use(helmet({
    contentSecurityPolicy: true,
    crossOriginEmbedderPolicy: true
  }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: config.nodeEnv === 'production' ? 100 : 1000, // limit each IP to 100 requests per windowMs in production
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use(limiter);

  // Stricter rate limiting for authentication endpoints
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    skipSuccessfulRequests: true,
    message: 'Too many authentication attempts, please try again later.'
  });

  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/register', authLimiter);
  app.use('/api/auth/forgot-password', authLimiter);

  // CORS configuration
  const corsOptions = {
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);

      const allowedOrigins = config.nodeEnv === 'production'
        ? process.env.ALLOWED_ORIGINS?.split(',') || []
        : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'];

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  };

  app.use(cors(corsOptions));

  // Prevent XSS attacks
  app.use(xss());

  // Sanitize data against NoSQL injection
  app.use(mongoSanitize({
    replaceWith: '_',
    onSanitize: ({ req, key }) => {
      console.warn(`Sanitized key: ${key} in request`);
    }
  }));

  // Prevent HTTP Parameter Pollution
  app.use(hpp({
    whitelist: ['sort', 'fields', 'page', 'limit', 'category', 'tags', 'status']
  }));
};

module.exports = setupSecurity;
