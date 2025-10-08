// File: src/routes/postRoutes.js
// Generated: 2025-10-08 14:28:48 UTC
// Project ID: proj_5fc90398e8e7
// Task ID: task_54wbunue5bs4


const express = require('express');

const { auth } = require('../middleware/auth');


const router = express.Router();

// Import controller methods (will be created)

const {
  getAllPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost
} = require('../controllers/postController');

/**
 * GET /api/posts
 * Fetch all posts (public)
 */
router.get('/', getAllPosts);

/**
 * GET /api/posts/:id
 * Fetch post by ID (public)
 */
router.get('/:id', getPostById);

/**
 * POST /api/posts
 * Create new post (requires authentication)
 */
router.post('/', auth, createPost);

/**
 * PUT /api/posts/:id
 * Update post (requires authentication)
 */
router.put('/:id', auth, updatePost);

/**
 * DELETE /api/posts/:id
 * Delete post (requires authentication)
 */
router.delete('/:id', auth, deletePost);

module.exports = router;
