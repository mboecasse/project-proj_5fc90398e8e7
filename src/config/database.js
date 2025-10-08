// File: src/config/database.js
// Generated: 2025-10-08 14:26:11 UTC
// Project ID: proj_5fc90398e8e7
// Task ID: task_dyuh8z7sfsco


const mongoose = require('mongoose');

/**
 * MongoDB connection configuration and management
 * SINGLE source of truth for database connection
 * All files must import mongoose from this file
 */

// Connection options


const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4
};

// Connection state tracking

let isConnected = false;

let isConnecting = false;

let eventHandlersRegistered = false;

/**
 * Register connection event handlers (only once)
 */


const registerEventHandlers = () => {
  if (eventHandlersRegistered) {
    return;
  }

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
    isConnected = false;
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected');
    isConnected = false;
  });

  mongoose.connection.on('reconnected', () => {
    console.log('MongoDB reconnected');
    isConnected = true;
  });

  eventHandlersRegistered = true;
};

/**
 * Connect to MongoDB with retry logic
 */


const connectDB = async () => {
  if (isConnected) {
    console.log('MongoDB already connected');
    return mongoose;
  }

  if (isConnecting) {
    console.log('MongoDB connection already in progress');
    // Wait for the ongoing connection attempt
    while (isConnecting) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return mongoose;
  }

  isConnecting = true;
  const maxRetries = 5;
  let retries = 0;

  // Register event handlers once before any connection attempt
  registerEventHandlers();

  while (retries < maxRetries) {
    try {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/blog';

      await mongoose.connect(mongoUri, options);

      isConnected = true;
      isConnecting = false;
      console.log(`MongoDB connected successfully to ${mongoose.connection.host}`);

      return mongoose;
    } catch (error) {
      retries++;
      console.error(`MongoDB connection attempt ${retries} failed:`, error.message);

      if (retries >= maxRetries) {
        console.error('Max retries reached. Could not connect to MongoDB');
        isConnecting = false;
        throw error;
      }

      // Wait before retrying (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, retries), 10000);
      console.log(`Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

/**
 * Gracefully disconnect from MongoDB
 */


const disconnectDB = async () => {
  if (!isConnected) {
    return;
  }

  try {
    await mongoose.connection.close();
    isConnected = false;
    console.log('MongoDB connection closed gracefully');
  } catch (error) {
    console.error('Error closing MongoDB connection:', error.message);
    throw error;
  }
};

/**
 * Get connection status
 */


const getConnectionStatus = () => {
  return {
    isConnected,
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host,
    name: mongoose.connection.name
  };
};

// Track if shutdown is in progress

let isShuttingDown = false;

// Graceful shutdown handler


const gracefulShutdown = async (signal) => {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  console.log(`\n${signal} received. Starting graceful shutdown...`);

  try {
    await disconnectDB();
    console.log('Graceful shutdown completed');
  } catch (error) {
    console.error('Error during graceful shutdown:', error);
    process.exitCode = 1;
  }
};

// Handle process termination
process.on('SIGINT', async () => {
  await gracefulShutdown('SIGINT');
});

process.on('SIGTERM', async () => {
  await gracefulShutdown('SIGTERM');
});

// Export mongoose instance and utility functions
module.exports = mongoose;
module.exports.connectDB = connectDB;
module.exports.disconnectDB = disconnectDB;
module.exports.getConnectionStatus = getConnectionStatus;
