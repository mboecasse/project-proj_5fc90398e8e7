// File: src/app.js
// Generated: 2025-10-08 14:28:08 UTC
// Project ID: proj_5fc90398e8e7
// Task ID: task_ffks3m937x4s


const compression = require('compression');


const cors = require('cors');


const errorHandler = require('./middleware/errorHandler');


const express = require('express');


const helmet = require('helmet');


const hpp = require('hpp');


const logger = require('./utils/logger');


const mongoSanitize = require('express-mongo-sanitize');


const morgan = require('morgan');


const rateLimiter = require('./middleware/rateLimiter');


const routes = require('./routes');


const securityMiddleware = require('./middleware/security');


const xss = require('xss-clean');


const app = express();

// Trust proxy - required for rate limiting behind proxies
app.set('trust proxy', 1);

// HTTP request logger (Morgan) - only in development
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate limiting - applied BEFORE body parsing
app.use(rateLimiter);

// Security middleware
app.use(helmet());
app.use(cors());
app.use(hpp());
app.use(xss());
app.use(mongoSanitize());
app.use(securityMiddleware);

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Health check endpoint (before routes)
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api', routes);

// 404 handler for undefined routes
app.use((req, res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
});

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;
