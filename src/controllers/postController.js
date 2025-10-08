// File: src/controllers/postController.js
// Generated: 2025-10-08 14:28:11 UTC
// Project ID: proj_5fc90398e8e7
// Task ID: task_nc57mk5snnys


const Post = require('../models/Post');


const logger = require('../utils/logger');

const { successResponse, errorResponse, paginatedResponse } = require('../utils/apiResponse');

// Whitelist for allowed sort fields


const ALLOWED_SORT_FIELDS = ['createdAt', 'updatedAt', 'title', 'status', 'author'];

// Whitelist for allowed status values


const ALLOWED_STATUS_VALUES = ['draft', 'published', 'archived'];

// Maximum search string length to prevent ReDoS


const MAX_SEARCH_LENGTH = 100;

/**
 * Sanitize string input to prevent NoSQL injection
 * @param {any} value - Input value to sanitize
 * @returns {string|null} - Sanitized string or null
 */


function sanitizeString(value) {
  if (typeof value !== 'string') {
    return null;
  }
  return value;
}

/**
 * Escape special regex characters
 * @param {string} string - String to escape
 * @returns {string} - Escaped string
 */


function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Get all posts with pagination and filtering
 * @route GET /api/posts
 * @query {number} page - Page number (default: 1)
 * @query {number} limit - Items per page (default: 10)
 * @query {string} status - Filter by status (draft, published, archived)
 * @query {string} author - Filter by author
 * @query {string} search - Search in title and content
 * @query {string} sortBy - Sort field (default: createdAt)
 * @query {string} sortOrder - Sort order (asc, desc) (default: desc)
 */
exports.getAllPosts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      author,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = { deletedAt: null };

    // Validate and sanitize status
    if (status) {
      const sanitizedStatus = sanitizeString(status);
      if (sanitizedStatus && ALLOWED_STATUS_VALUES.includes(sanitizedStatus)) {
        query.status = sanitizedStatus;
      } else {
        logger.warn('Invalid status value provided', { status });
        return res.status(400).json(errorResponse('Invalid status value'));
      }
    }

    // Validate and sanitize author
    if (author) {
      const sanitizedAuthor = sanitizeString(author);
      if (sanitizedAuthor) {
        query.author = sanitizedAuthor;
      } else {
        logger.warn('Invalid author value provided', { author });
        return res.status(400).json(errorResponse('Invalid author value'));
      }
    }

    // Validate and sanitize search
    if (search) {
      const sanitizedSearch = sanitizeString(search);
      if (!sanitizedSearch) {
        logger.warn('Invalid search value provided', { search });
        return res.status(400).json(errorResponse('Invalid search value'));
      }

      if (sanitizedSearch.length > MAX_SEARCH_LENGTH) {
        logger.warn('Search string too long', { length: sanitizedSearch.length });
        return res.status(400).json(errorResponse('Search string is too long'));
      }

      // Escape special regex characters and anchor the pattern
      const escapedSearch = escapeRegex(sanitizedSearch);
      query.$or = [
        { title: { $regex: `^.*${escapedSearch}.*$`, $options: 'i' } },
        { content: { $regex: `^.*${escapedSearch}.*$`, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Validate sortBy against whitelist
    const sanitizedSortBy = sanitizeString(sortBy);
    if (!sanitizedSortBy || !ALLOWED_SORT_FIELDS.includes(sanitizedSortBy)) {
      logger.warn('Invalid sortBy field provided', { sortBy });
      return res.status(400).json(errorResponse('Invalid sort field'));
    }

    // Build sort object with validated field
    const sort = {};
    sort[sanitizedSortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query with pagination
    const [posts, total] = await Promise.all([
      Post.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Post.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limitNum);

    logger.info('Fetched posts with pagination', {
      page: pageNum,
      limit: limitNum,
      total,
      filters: { status, author, search }
    });

    res.json(paginatedResponse(posts, {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages,
      hasNextPage: pageNum < totalPages,
      hasPrevPage: pageNum > 1
    }));
  } catch (error) {
    logger.error('Failed to fetch posts', { error: error.message, query: req.query });
    next(error);
  }
};

/**
 * Get post by ID
 * @route GET /api/posts/:id
 * @param {string} id - Post ID
 */
exports.getPostById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const post = await Post.findOne({ _id: id, deletedAt: null });

    if (!post) {
      logger.warn('Post not found', { postId: id });
      return res.status(404).json(errorResponse('Post not found'));
    }

    logger.info('Fetched post by ID', { postId: id });

    res.json(successResponse(post, 'Post retrieved successfully'));
  } catch (error) {
    logger.error('Failed to fetch post', { postId: req.params.id, error: error.message });
    next(error);
  }
};

/**
 * Create new post
 * @route POST /api/posts
 * @body {string} title - Post title
 * @body {string} content - Post content
 * @body {string} author - Post author
 * @body {string} status - Post status (draft, published, archived)
 */
exports.createPost = async (req, res, next) => {
  try {
    const { title, content, author, status } = req.body;

    // Check for duplicate title
    const existingPost = await Post.findOne({ title, deletedAt: null });
    if (existingPost) {
      logger.warn('Attempted to create post with duplicate title', { title });
      return res.status(400).json(errorResponse('Post with this title already exists'));
    }

    // Create post
    const post = await Post.create({
      title,
      content,
      author,
      status: status || 'draft',
      version: 1
    });

    logger.info('Created new post', { postId: post._id, title, author });

    res.status(201).json(successResponse(post, 'Post created successfully'));
  } catch (error) {
    logger.error('Failed to create post', { error: error.message, body: req.body });
    next(error);
  }
};

/**
 * Update post with version check
 * @route PUT /api/posts/:id
 * @param {string} id - Post ID
 * @body {string} title - Post title
 * @body {string} content - Post content
 * @body {string} author - Post author
 * @body {string} status - Post status
 * @body {number} version - Current version for optimistic locking
 */
exports.updatePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, content, author, status, version } = req.body;

    // Find post with version check
    const post = await Post.findOne({ _id: id, deletedAt: null });

    if (!post) {
      logger.warn('Post not found for update', { postId: id });
      return res.status(404).json(errorResponse('Post not found'));
    }

    // Version check for optimistic locking
    if (version !== undefined && post.version !== version) {
      logger.warn('Version conflict detected', {
        postId: id,
        expectedVersion: version,
        currentVersion: post.version
      });
      return res.status(409).json(errorResponse('Post has been modified by another user. Please refresh and try again.'));
    }

    // Check for duplicate title (excluding current post)
    if (title && title !== post.title) {
      const duplicatePost = await Post.findOne({ title, _id: { $ne: id }, deletedAt: null });
      if (duplicatePost) {
        logger.warn('Attempted to update post with duplicate title', { title, postId: id });
        return res.status(400).json(errorResponse('Another post with this title already exists'));
      }
    }

    // Update fields
    if (title !== undefined) post.title = title;
    if (content !== undefined) post.content = content;
    if (author !== undefined) post.author = author;
    if (status !== undefined) post.status = status;

    // Increment version
    post.version += 1;

    await post.save();

    logger.info('Updated post', { postId: id, newVersion: post.version });

    res.json(successResponse(post, 'Post updated successfully'));
  } catch (error) {
    logger.error('Failed to update post', { postId: req.params.id, error: error.message });
    next(error);
  }
};

/**
 * Delete post with soft delete option
 * @route DELETE /api/posts/:id
 * @param {string} id - Post ID
 * @query {boolean} hard - If true, permanently delete; otherwise soft delete
 */
exports.deletePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { hard } = req.query;

    const post = await Post.findOne({ _id: id, deletedAt: null });

    if (!post) {
      logger.warn('Post not found for deletion', { postId: id });
      return res.status(404).json(errorResponse('Post not found'));
    }

    if (hard === 'true') {
      // Hard delete - permanently remove from database
      await Post.findByIdAndDelete(id);
      logger.info('Permanently deleted post', { postId: id });
      res.json(successResponse(null, 'Post permanently deleted'));
    } else {
      // Soft delete - set deletedAt timestamp
      post.deletedAt = new Date();
      await post.save();
      logger.info('Soft deleted post', { postId: id });
      res.json(successResponse(null, 'Post deleted successfully'));
    }
  } catch (error) {
    logger.error('Failed to delete post', { postId: req.params.id, error: error.message });
    next(error);
  }
};
