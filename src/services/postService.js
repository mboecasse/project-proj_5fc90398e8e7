// File: src/services/postService.js
// Generated: 2025-10-08 14:27:30 UTC
// Project ID: proj_5fc90398e8e7
// Task ID: task_au5d9qd55cyv


const Post = require('../models/Post');


const logger = require('../utils/logger');

/**
 * Build pagination object
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @param {number} total - Total count of items
 * @returns {Object} Pagination metadata
 */
exports.buildPagination = (page, limit, total) => {
  const totalPages = Math.ceil(total / limit);

  return {
    currentPage: page,
    totalPages,
    totalItems: total,
    itemsPerPage: limit,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1
  };
};

/**
 * Parse and validate pagination parameters
 * @param {Object} query - Request query parameters
 * @returns {Object} Validated page and limit
 */
exports.parsePaginationParams = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));

  return { page, limit };
};

/**
 * Sanitize regex input to prevent injection
 * @param {string} input - Input string to sanitize
 * @returns {string} Sanitized string
 */


const sanitizeRegex = (input) => {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Build filter object from query parameters
 * @param {Object} query - Request query parameters
 * @returns {Object} MongoDB filter object
 */
exports.buildPostFilter = (query) => {
  const filter = { deletedAt: null }; // Exclude soft deleted posts by default

  // Filter by status
  if (query.status) {
    filter.status = query.status;
  }

  // Filter by author
  if (query.author) {
    filter.author = query.author;
  }

  // Search in title and content
  if (query.search) {
    const sanitizedSearch = sanitizeRegex(query.search);
    filter.$or = [
      { title: { $regex: sanitizedSearch, $options: 'i' } },
      { content: { $regex: sanitizedSearch, $options: 'i' } }
    ];
  }

  // Date range filters
  if (query.startDate || query.endDate) {
    filter.createdAt = {};

    if (query.startDate) {
      filter.createdAt.$gte = new Date(query.startDate);
    }

    if (query.endDate) {
      filter.createdAt.$lte = new Date(query.endDate);
    }
  }

  return filter;
};

/**
 * Build sort object from query parameters
 * @param {Object} query - Request query parameters
 * @returns {Object} MongoDB sort object
 */
exports.buildSortOptions = (query) => {
  const allowedSortFields = ['createdAt', 'updatedAt', 'title', 'status', 'views'];
  const sortBy = allowedSortFields.includes(query.sortBy) ? query.sortBy : 'createdAt';
  const sortOrder = query.sortOrder === 'asc' ? 1 : -1;

  return { [sortBy]: sortOrder };
};

/**
 * Soft delete a post by setting deletedAt timestamp
 * @param {string} postId - Post ID to soft delete
 * @param {string} userId - User ID performing the deletion
 * @returns {Promise<Object>} Updated post
 */
exports.softDeletePost = async (postId, userId) => {
  try {
    const post = await Post.findById(postId);

    if (!post) {
      const error = new Error('Post not found');
      error.statusCode = 404;
      throw error;
    }

    if (post.deletedAt) {
      const error = new Error('Post already deleted');
      error.statusCode = 400;
      throw error;
    }

    // Check authorization
    if (post.author.toString() !== userId) {
      const error = new Error('Not authorized to delete this post');
      error.statusCode = 403;
      throw error;
    }

    post.deletedAt = new Date();
    await post.save();

    logger.info('Post soft deleted', { postId, userId });

    return post;
  } catch (error) {
    logger.error('Failed to soft delete post', {
      postId,
      userId,
      error: error.message
    });
    throw error;
  }
};

/**
 * Restore a soft deleted post
 * @param {string} postId - Post ID to restore
 * @param {string} userId - User ID performing the restoration
 * @returns {Promise<Object>} Restored post
 */
exports.restorePost = async (postId, userId) => {
  try {
    const post = await Post.findById(postId);

    if (!post) {
      const error = new Error('Post not found');
      error.statusCode = 404;
      throw error;
    }

    if (!post.deletedAt) {
      const error = new Error('Post is not deleted');
      error.statusCode = 400;
      throw error;
    }

    // Check authorization
    if (post.author.toString() !== userId) {
      const error = new Error('Not authorized to restore this post');
      error.statusCode = 403;
      throw error;
    }

    post.deletedAt = null;
    await post.save();

    logger.info('Post restored', { postId, userId });

    return post;
  } catch (error) {
    logger.error('Failed to restore post', {
      postId,
      userId,
      error: error.message
    });
    throw error;
  }
};

/**
 * Check for version conflicts before updating
 * @param {string} postId - Post ID to check
 * @param {number} clientVersion - Version number from client
 * @returns {Promise<boolean>} True if no conflict, throws error if conflict
 */
exports.checkVersionConflict = async (postId, clientVersion) => {
  try {
    const post = await Post.findById(postId);

    if (!post) {
      const error = new Error('Post not found');
      error.statusCode = 404;
      throw error;
    }

    // Check if post was modified since client retrieved it
    if (clientVersion !== undefined && post.__v !== clientVersion) {
      const error = new Error('Version conflict: Post has been modified by another user');
      error.statusCode = 409;
      error.currentVersion = post.__v;
      throw error;
    }

    return true;
  } catch (error) {
    logger.error('Version conflict check failed', {
      postId,
      clientVersion,
      error: error.message
    });
    throw error;
  }
};

/**
 * Update post with version conflict detection
 * @param {string} postId - Post ID to update
 * @param {Object} updates - Update data
 * @param {string} userId - User ID performing the update
 * @param {number} clientVersion - Version number from client
 * @returns {Promise<Object>} Updated post
 */
exports.updatePostWithVersionCheck = async (postId, updates, userId, clientVersion) => {
  try {
    // Check version conflict first
    await exports.checkVersionConflict(postId, clientVersion);

    const post = await Post.findById(postId);

    // Check authorization
    if (post.author.toString() !== userId) {
      const error = new Error('Not authorized to update this post');
      error.statusCode = 403;
      throw error;
    }

    // Check if post is deleted
    if (post.deletedAt) {
      const error = new Error('Cannot update deleted post');
      error.statusCode = 400;
      throw error;
    }

    // Apply updates
    Object.keys(updates).forEach(key => {
      if (key !== '_id' && key !== '__v' && key !== 'author' && key !== 'createdAt') {
        post[key] = updates[key];
      }
    });

    await post.save();

    logger.info('Post updated with version check', {
      postId,
      userId,
      newVersion: post.__v
    });

    return post;
  } catch (error) {
    logger.error('Failed to update post with version check', {
      postId,
      userId,
      clientVersion,
      error: error.message
    });
    throw error;
  }
};

/**
 * Get posts with pagination and filtering
 * @param {Object} query - Query parameters
 * @returns {Promise<Object>} Posts with pagination metadata
 */
exports.getPostsWithPagination = async (query) => {
  try {
    const { page, limit } = exports.parsePaginationParams(query);
    const filter = exports.buildPostFilter(query);
    const sort = exports.buildSortOptions(query);

    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      Post.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('author', 'name email'),
      Post.countDocuments(filter)
    ]);

    const pagination = exports.buildPagination(page, limit, total);

    logger.info('Fetched posts with pagination', {
      page,
      limit,
      total,
      filterCount: Object.keys(filter).length
    });

    return {
      posts,
      pagination
    };
  } catch (error) {
    logger.error('Failed to fetch posts with pagination', {
      error: error.message
    });
    throw error;
  }
};

/**
 * Check if user is authorized to modify post
 * @param {string} postId - Post ID
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} True if authorized
 */
exports.checkPostAuthorization = async (postId, userId) => {
  try {
    const post = await Post.findById(postId);

    if (!post) {
      const error = new Error('Post not found');
      error.statusCode = 404;
      throw error;
    }

    if (post.author.toString() !== userId) {
      const error = new Error('Not authorized to modify this post');
      error.statusCode = 403;
      throw error;
    }

    return true;
  } catch (error) {
    logger.error('Authorization check failed', {
      postId,
      userId,
      error: error.message
    });
    throw error;
  }
};

/**
 * Permanently delete soft-deleted posts older than specified days
 * @param {number} days - Number of days threshold
 * @returns {Promise<number>} Number of posts permanently deleted
 */
exports.permanentlyDeleteOldPosts = async (days = 30) => {
  try {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() - days);

    const result = await Post.deleteMany({
      deletedAt: { $ne: null, $lte: threshold }
    });

    logger.info('Permanently deleted old posts', {
      count: result.deletedCount,
      daysThreshold: days
    });

    return result.deletedCount;
  } catch (error) {
    logger.error('Failed to permanently delete old posts', {
      days,
      error: error.message
    });
    throw error;
  }
};
