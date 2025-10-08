// File: src/server.js
// Generated: 2025-10-08 14:28:57 UTC
// Project ID: proj_5fc90398e8e7
// Task ID: task_l65ze9b9inf2


const app = require('./app');


const config = require('./config/env');


const logger = require('./utils/logger');


const mongoose = require('./config/database');


let server;

let isShuttingDown = false;

let eventListeners = null;

/**
 * Start the HTTP server
 */


const startServer = async () => {
  try {
    // Remove existing event listeners if any
    if (eventListeners) {
      process.removeListener('unhandledRejection', eventListeners.unhandledRejection);
      process.removeListener('uncaughtException', eventListeners.uncaughtException);
      process.removeListener('SIGTERM', eventListeners.sigterm);
      process.removeListener('SIGINT', eventListeners.sigint);
    }

    // Connect to database
    await mongoose.connect(config.mongodb.uri, config.mongodb.options);
    logger.info('Database connected successfully', {
      database: config.mongodb.uri.split('@')[1] || 'localhost'
    });

    // Start server
    server = app.listen(config.port, () => {
      logger.info(`Server running in ${config.env} mode on port ${config.port}`, {
        port: config.port,
        env: config.env
      });
    });

    // Define event listeners
    eventListeners = {
      unhandledRejection: (err) => {
        logger.error('Unhandled Promise Rejection', {
          error: err.message,
          stack: err.stack
        });
        gracefulShutdown('unhandledRejection');
      },
      uncaughtException: (err) => {
        logger.error('Uncaught Exception', {
          error: err.message,
          stack: err.stack
        });
        // Uncaught exceptions leave process in undefined state - exit immediately
        try {
          if (server) {
            server.close(() => {
              process.exit(1);
            });
            setTimeout(() => {
              process.exit(1);
            }, 1000);
          } else {
            process.exit(1);
          }
        } catch (e) {
          process.exit(1);
        }
      },
      sigterm: () => {
        logger.info('SIGTERM signal received');
        gracefulShutdown('SIGTERM');
      },
      sigint: () => {
        logger.info('SIGINT signal received');
        gracefulShutdown('SIGINT');
      }
    };

    // Handle unhandled promise rejections
    process.on('unhandledRejection', eventListeners.unhandledRejection);

    // Handle uncaught exceptions
    process.on('uncaughtException', eventListeners.uncaughtException);

    // Handle SIGTERM signal
    process.on('SIGTERM', eventListeners.sigterm);

    // Handle SIGINT signal (Ctrl+C)
    process.on('SIGINT', eventListeners.sigint);

  } catch (error) {
    logger.error('Failed to start server', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
};

/**
 * Graceful shutdown handler
 */


const gracefulShutdown = async (signal) => {
  // Prevent multiple simultaneous shutdown attempts
  if (isShuttingDown) {
    return;
  }
  isShuttingDown = true;

  logger.info(`${signal} received, starting graceful shutdown`);

  // Stop accepting new connections
  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed');

      try {
        // Close database connection
        await mongoose.connection.close();
        logger.info('Database connection closed');

        logger.info('Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        logger.error('Error during graceful shutdown', {
          error: error.message
        });
        process.exit(1);
      }
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
};

// Start the server
startServer();

module.exports = server;
