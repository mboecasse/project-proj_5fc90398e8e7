// File: src/config/env.js
// Generated: 2025-10-08 14:25:49 UTC
// Project ID: proj_5fc90398e8e7
// Task ID: task_rl6k1etfb497

* Validates and exports all environment variables
 */

// Load environment variables from .env file
require('dotenv').config();


const requiredEnvVars = [
  'NODE_ENV',
  'PORT',
  'MONGODB_URI'
];

// Validate required environment variables


const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
}

// Validate NODE_ENV


const validEnvironments = ['development', 'production', 'test'];
if (!validEnvironments.includes(process.env.NODE_ENV)) {
  throw new Error(`Invalid NODE_ENV: ${process.env.NODE_ENV}. Must be one of: ${validEnvironments.join(', ')}`);
}

// Validate PORT


const port = parseInt(process.env.PORT, 10);
if (isNaN(port) || port < 1 || port > 65535) {
  throw new Error(`Invalid PORT: ${process.env.PORT}. Must be a number between 1 and 65535`);
}

// Validate MONGODB_URI format


const mongoUri = process.env.MONGODB_URI;
if (!mongoUri.startsWith('mongodb://') && !mongoUri.startsWith('mongodb+srv://')) {
  throw new Error('Invalid MONGODB_URI: Must start with mongodb:// or mongodb+srv://');
}

// Validate CORS_ORIGIN in production
if (process.env.NODE_ENV === 'production' && (!process.env.CORS_ORIGIN || process.env.CORS_ORIGIN === '*')) {
  throw new Error('CORS_ORIGIN must be explicitly configured in production (cannot be "*" or empty)');
}


const config = {
  // Environment
  env: process.env.NODE_ENV,
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',

  // Server
  port: port,
  host: process.env.HOST || 'localhost',

  // Database
  mongodb: {
    uri: mongoUri,
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE, 10) || 10,
      minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE, 10) || 2,
      socketTimeoutMS: parseInt(process.env.MONGODB_SOCKET_TIMEOUT, 10) || 45000,
      serverSelectionTimeoutMS: parseInt(process.env.MONGODB_SERVER_SELECTION_TIMEOUT, 10) || 5000
    }
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: process.env.CORS_CREDENTIALS === 'true'
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
    format: process.env.LOG_FORMAT || 'json'
  }
};

// Freeze config to prevent modifications
Object.freeze(config);
Object.freeze(config.mongodb);
Object.freeze(config.mongodb.options);
Object.freeze(config.cors);
Object.freeze(config.rateLimit);
Object.freeze(config.logging);

module.exports = config;
