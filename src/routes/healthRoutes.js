// File: src/routes/healthRoutes.js
// Generated: 2025-10-08 14:25:01 UTC
// Project ID: proj_5fc90398e8e7
// Task ID: task_r73e7djs2sdo


const express = require('express');


const logger = require('../utils/logger');


const mongoose = require('../config/database');


const router = express.Router();

/**
 * GET /health
 * Health check endpoint for monitoring
 * Returns system status and database connectivity
 */
router.get('/', async (req, res) => {
  try {
    const healthCheck = {
      success: true,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      status: 'OK',
      service: 'Blog API',
      database: 'disconnected',
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        unit: 'MB'
      }
    };

    // Check database connection
    if (mongoose.connection.readyState === 1) {
      healthCheck.database = 'connected';
    } else if (mongoose.connection.readyState === 2) {
      healthCheck.database = 'connecting';
    } else if (mongoose.connection.readyState === 3) {
      healthCheck.database = 'disconnecting';
    }

    // If database is not connected, return 503
    if (healthCheck.database !== 'connected') {
      healthCheck.status = 'DEGRADED';
      logger.warn('Health check: Database not connected', {
        dbState: healthCheck.database
      });
      return res.status(503).json(healthCheck);
    }

    logger.info('Health check passed', {
      uptime: healthCheck.uptime,
      memory: healthCheck.memory.used
    });

    res.json(healthCheck);
  } catch (error) {
    logger.error('Health check failed', { error: error.message });

    res.status(503).json({
      success: false,
      timestamp: new Date().toISOString(),
      status: 'ERROR',
      error: 'Health check failed'
    });
  }
});

/**
 * GET /health/ready
 * Readiness probe - checks if service is ready to accept traffic
 */
router.get('/ready', async (req, res) => {
  try {
    // Check if database is connected
    if (mongoose.connection.readyState !== 1) {
      logger.warn('Readiness check failed: Database not ready');
      return res.status(503).json({
        success: false,
        ready: false,
        reason: 'Database not connected'
      });
    }

    res.json({
      success: true,
      ready: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Readiness check failed', { error: error.message });
    res.status(503).json({
      success: false,
      ready: false,
      error: error.message
    });
  }
});

/**
 * GET /health/live
 * Liveness probe - checks if service is alive
 */
router.get('/live', (req, res) => {
  res.json({
    success: true,
    alive: true,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
