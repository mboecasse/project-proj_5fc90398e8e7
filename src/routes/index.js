// File: src/routes/index.js
// Generated: 2025-10-08 14:24:51 UTC
// Project ID: proj_5fc90398e8e7
// Task ID: task_qiw40rov8fiz


const express = require('express');


const logger = require('../utils/logger');


const postRoutes = require('./postRoutes');


const router = express.Router();

/**
 * Route Aggregator
 * Combines all route modules and exports single router
 */

// Import route modules

// Health check endpoint
router.get('/health', (req, res) => {
  logger.info('Health check endpoint accessed');
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

// Mount route modules
router.use('/posts', postRoutes);

// 404 handler for undefined routes
router.use('*', (req, res) => {
  logger.warn('Route not found', {
    method: req.method,
    path: req.originalUrl
  });
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

module.exports = router;
