// File: src/utils/logger.js
// Generated: 2025-10-08 14:26:08 UTC
// Project ID: proj_5fc90398e8e7
// Task ID: task_whryd7qi0hv1


const fs = require('fs');


const path = require('path');


const winston = require('winston');

// Create logs directory if it doesn't exist


const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Sensitive data sanitization function


const sanitizeMetadata = (metadata) => {
  const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'api_key', 'authorization', 'auth', 'creditCard', 'ssn', 'email', 'phone'];
  const sanitized = { ...metadata };

  const sanitizeObject = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const lowerKey = key.toLowerCase();
        if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
          obj[key] = '[REDACTED]';
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitizeObject(obj[key]);
        }
      }
    }
    return obj;
  };

  return sanitizeObject(sanitized);
};

// Custom format to sanitize sensitive data


const sanitizeFormat = winston.format((info) => {
  if (info.metadata) {
    info.metadata = sanitizeMetadata(info.metadata);
  }

  // Sanitize any additional properties
  const { level, message, timestamp, stack, ...rest } = info;
  const sanitizedRest = sanitizeMetadata(rest);

  return {
    level,
    message,
    timestamp,
    stack,
    ...sanitizedRest
  };
});

// Define log format with sanitization


const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  sanitizeFormat(),
  winston.format.json()
);

// Define console format for development


const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  sanitizeFormat(),
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    return msg;
  })
);

// Create transports array with file locking options


const transports = [
  // Console transport
  new winston.transports.Console({
    format: consoleFormat,
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
  }),

  // Error log file
  new winston.transports.File({
    filename: path.join(logsDir, 'error.log'),
    level: 'error',
    format: logFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    options: { flags: 'a' }
  }),

  // Combined log file
  new winston.transports.File({
    filename: path.join(logsDir, 'combined.log'),
    format: logFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    options: { flags: 'a' }
  })
];

// Create logger instance


const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports,
  exitOnError: false
});

// Handle uncaught exceptions
logger.exceptions.handle(
  new winston.transports.File({
    filename: path.join(logsDir, 'exceptions.log'),
    maxsize: 5242880,
    maxFiles: 5,
    options: { flags: 'a' }
  })
);

// Handle unhandled promise rejections
logger.rejections.handle(
  new winston.transports.File({
    filename: path.join(logsDir, 'rejections.log'),
    maxsize: 5242880,
    maxFiles: 5,
    options: { flags: 'a' }
  })
);

module.exports = logger;
