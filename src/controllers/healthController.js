// File: src/controllers/healthController.js
// Generated: 2025-10-08 14:27:03 UTC
// Project ID: proj_5fc90398e8e7
// Task ID: task_2rk6tswkul8w


const logger = require('../utils/logger');


const mongoose = require('../config/database');

const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * Health check controller
 * Checks database connection and returns system status
 */
exports.healthCheck = async (req, res, next) => {
  try {
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        status: 'disconnected'
      }
    };

    // Check database connection
    if (mongoose.connection.readyState === 1) {
      // Connection is open - test with a simple query
      try {
        await mongoose.connection.db.admin().ping();
        healthStatus.database.status = 'connected';
      } catch (dbError) {
        logger.error('Database ping failed', { error: dbError.message });
        healthStatus.database.status = 'error';
        healthStatus.status = 'unhealthy';
      }
    } else {
      logger.warn('Database connection not ready', { readyState: mongoose.connection.readyState });
      healthStatus.database.status = 'disconnected';
      healthStatus.status = 'unhealthy';
    }

    // Log health check
    logger.info('Health check performed', {
      status: healthStatus.status,
      dbStatus: healthStatus.database.status
    });

    // Return appropriate status code
    const statusCode = healthStatus.status === 'healthy' ? 200 : 503;

    res.status(statusCode).json(
      successResponse(healthStatus, 'Health check completed')
    );

  } catch (error) {
    logger.error('Health check failed', { error: error.message });

    res.status(503).json(
      errorResponse('Health check failed', 503)
    );
  }
};

/**
 * Simple liveness probe
 * Returns 200 if service is running
 */
exports.liveness = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Service is alive',
    timestamp: new Date().toISOString()
  });
};

/**
 * Readiness probe
 * Returns 200 only if service is ready to accept traffic (DB connected)
 */
exports.readiness = async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.db.admin().ping();

      res.status(200).json({
        success: true,
        message: 'Service is ready',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        success: false,
        error: 'Service not ready - database not connected',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    logger.error('Readiness check failed', { error: error.message });

    res.status(503).json({
      success: false,
      error: 'Service not ready',
      timestamp: new Date().toISOString()
    });
  }
};
