// File: src/middleware/auth.js
// Generated: 2025-10-08 14:28:02 UTC
// Project ID: proj_5fc90398e8e7
// Task ID: task_tq6g92eruy7f


const config = require('../config/env');


const jwt = require('jsonwebtoken');


const logger = require('../utils/logger');

/**
 * Validates the decoded token payload
 */


const validateTokenPayload = (decoded) => {
  // Check required fields exist
  const userId = decoded.userId || decoded.id;
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid token: missing or invalid userId');
  }

  if (!decoded.email || typeof decoded.email !== 'string') {
    throw new Error('Invalid token: missing or invalid email');
  }

  if (!decoded.role || typeof decoded.role !== 'string') {
    throw new Error('Invalid token: missing or invalid role');
  }

  return {
    userId,
    email: decoded.email,
    role: decoded.role
  };
};

/**
 * Authentication middleware - verifies JWT token
 * Sets req.user and req.userId on successful authentication
 */


const auth = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('Authentication failed: No token provided');
      return res.status(401).json({
        success: false,
        error: 'Access denied. No token provided.'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token with algorithm whitelist
    const decoded = jwt.verify(token, config.jwt.accessSecret, {
      algorithms: ['HS256']
    });

    // Validate token payload
    const validatedPayload = validateTokenPayload(decoded);

    // Attach user info to request
    req.userId = validatedPayload.userId;
    req.user = {
      _id: validatedPayload.userId,
      email: validatedPayload.email,
      role: validatedPayload.role
    };

    logger.debug('User authenticated successfully', { userId: req.userId });

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      logger.warn('Authentication failed: Token expired');
      return res.status(401).json({
        success: false,
        error: 'Token expired. Please login again.'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      logger.warn('Authentication failed: Invalid token');
      return res.status(401).json({
        success: false,
        error: 'Invalid token.'
      });
    }

    logger.error('Authentication error', { error: error.message });
    return res.status(401).json({
      success: false,
      error: 'Authentication failed.'
    });
  }
};

/**
 * Optional authentication middleware
 * Verifies token if present, but doesn't fail if missing
 */


const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without authentication
      return next();
    }

    const token = authHeader.substring(7);

    // Verify token with algorithm whitelist
    const decoded = jwt.verify(token, config.jwt.accessSecret, {
      algorithms: ['HS256']
    });

    // Validate token payload
    const validatedPayload = validateTokenPayload(decoded);

    // Attach user info to request
    req.userId = validatedPayload.userId;
    req.user = {
      _id: validatedPayload.userId,
      email: validatedPayload.email,
      role: validatedPayload.role
    };

    logger.debug('User authenticated (optional)', { userId: req.userId });

    next();
  } catch (error) {
    // Token is invalid, but we continue without authentication
    logger.debug('Optional auth: Invalid or expired token, continuing without auth');
    next();
  }
};

module.exports = {
  auth,
  optionalAuth,
  authenticate: auth // Alias for compatibility
};
