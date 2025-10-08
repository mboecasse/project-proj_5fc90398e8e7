// File: tests/setup.js
// Generated: 2025-10-08 14:27:00 UTC
// Project ID: proj_5fc90398e8e7
// Task ID: task_l83h25dmzreb

  const Post = require('../src/models/Post');


const mongoose = require('../src/config/database');

// Connection lock to prevent race conditions

let connectionPromise = null;


const CONNECTION_TIMEOUT = 10000;

/**
 * Setup test environment before running tests
 */
beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';

  // Validate test database URI is set
  const testDbUri = process.env.MONGODB_TEST_URI;

  if (!testDbUri) {
    throw new Error('MONGODB_TEST_URI environment variable must be set for tests. Refusing to use default URI for security reasons.');
  }

  // Ensure URI contains test indicator to prevent production connections
  if (!testDbUri.includes('test') && !testDbUri.includes('Test') && !testDbUri.includes('TEST')) {
    throw new Error('MONGODB_TEST_URI must contain "test" in the URI to prevent accidental production connections.');
  }

  // Handle concurrent connection attempts with lock
  if (connectionPromise) {
    await connectionPromise;
    return;
  }

  if (mongoose.connection.readyState === 0) {
    connectionPromise = mongoose.connect(testDbUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: CONNECTION_TIMEOUT
    });

    try {
      await connectionPromise;
    } catch (error) {
      connectionPromise = null;
      throw error;
    }
  } else if (mongoose.connection.readyState === 2) {
    // Connection is in connecting state, wait for it
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, CONNECTION_TIMEOUT);

      mongoose.connection.once('connected', () => {
        clearTimeout(timeout);
        resolve();
      });

      mongoose.connection.once('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  }
});

/**
 * Clean up database before each test
 */
beforeEach(async () => {
  // Verify connection is ready before attempting cleanup
  if (mongoose.connection.readyState !== 1) {
    throw new Error('Database connection is not ready. Current state: ' + mongoose.connection.readyState);
  }

  // Clear all collections
  const collections = mongoose.connection.collections;

  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

/**
 * Cleanup after all tests complete
 */
afterAll(async () => {
  // Close database connection
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
  connectionPromise = null;
});

/**
 * Helper function to create test data
 */
global.createTestPost = async (data = {}) => {
  if (mongoose.connection.readyState !== 1) {
    throw new Error('Database connection is not ready');
  }

  const defaultData = {
    title: 'Test Post',
    content: 'Test content for post',
    author: 'Test Author',
    ...data
  };

  return await Post.create(defaultData);
};

/**
 * Helper function to clean specific collection
 */
global.cleanCollection = async (collectionName) => {
  if (mongoose.connection.readyState !== 1) {
    throw new Error('Database connection is not ready');
  }

  const collection = mongoose.connection.collections[collectionName];
  if (collection) {
    await collection.deleteMany({});
  }
};

/**
 * Helper function to get collection count
 */
global.getCollectionCount = async (collectionName) => {
  if (mongoose.connection.readyState !== 1) {
    throw new Error('Database connection is not ready');
  }

  const collection = mongoose.connection.collections[collectionName];
  if (collection) {
    return await collection.countDocuments();
  }
  return 0;
};
