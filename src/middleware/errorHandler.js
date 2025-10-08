// File: src/middleware/errorHandler.js
// Generated: 2025-10-08 14:27:30 UTC
// Project ID: proj_5fc90398e8e7
// Task ID: task_zb4kfao18qv4


const logger = require('../utils/logger');

const { errorResponse } = require('../utils/apiResponse');

/**
 * Sanitize sensitive values from error data
 */


const sanitizeValue = (value) => {
  if (typeof value === 'string') {
    // Mask potential tokens, passwords, or sensitive data
    if (value.length > 20) {
      return `${value.substring(0, 8)}...[REDACTED]`;
    }
  }
  return '[REDACTED]';
};

/**
 * Global error handling middleware
 * Catches all errors and formats consistent error responses
 * Must be registered LAST in middleware chain
 */


const errorHandler = (err, req, res, next) => {
  // Log error with full context (sanitized in production)
  const logData = {
    error: err.message,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userId: req.userId || 'unauthenticated'
  };

  // Only include stack traces in development and ensure they're not exposed externally
  if (process.env.NODE_ENV === 'development') {
    logData.stack = err.stack;
    logger.error('Error occurred (DEV)', logData);
  } else {
    logger.error('Error occurred', logData);
  }

  // Default error values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const errors = Object.values(err.errors).map(e => e.message);
    message = errors.join(', ');
    logger.warn('Mongoose validation error', { errorCount: errors.length });
  }

  // Mongoose duplicate key error - don't expose field names
  if (err.code === 11000) {
    statusCode = 400;
    message = 'Duplicate value detected. Please use unique values.';
    logger.warn('Mongoose duplicate key error', { code: 11000 });
  }

  // Mongoose cast error (invalid ObjectId) - sanitize value
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path} format`;
    logger.warn('Mongoose cast error', {
      path: err.path,
      value: sanitizeValue(err.value)
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    logger.warn('JWT error');
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
    logger.warn('Token expired');
  }

  // Don't expose internal error details in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'Internal Server Error';
  }

  // Send error response
  res.status(statusCode).json(errorResponse(message, statusCode));
};

/**
 * 404 Not Found handler
 * Catches requests to non-existent routes
 */


const notFound = (req, res, next) => {
  const message = `Route not found: ${req.method} ${req.originalUrl}`;
  logger.warn('404 Not Found', {
    method: req.method,
    path: req.originalUrl,
    ip: req.ip
  });
  res.status(404).json(errorResponse(message, 404));
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors automatically
 */


const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  errorHandler,
  notFound,
  asyncHandler
};
