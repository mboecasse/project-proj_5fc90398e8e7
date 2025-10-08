// File: src/validators/postValidator.js
// Generated: 2025-10-08 14:25:25 UTC
// Project ID: proj_5fc90398e8e7
// Task ID: task_ge2c9pmjy9l9


const { body, param, query } = require('express-validator');

/**
 * Validation rules for creating a post
 */


const createPostValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters')
    .escape(),

  body('content')
    .trim()
    .notEmpty()
    .withMessage('Content is required')
    .isLength({ min: 10 })
    .withMessage('Content must be at least 10 characters long')
    .escape(),

  body('author')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Author name must be between 2 and 100 characters')
    .escape(),

  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),

  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each tag must be between 1 and 50 characters')
    .escape(),

  body('published')
    .optional()
    .isBoolean()
    .withMessage('Published must be a boolean value')
];

/**
 * Validation rules for updating a post
 */


const updatePostValidation = [
  param('id')
    .notEmpty()
    .withMessage('Post ID is required')
    .isMongoId()
    .withMessage('Invalid post ID format'),

  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty')
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters')
    .escape(),

  body('content')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Content cannot be empty')
    .isLength({ min: 10 })
    .withMessage('Content must be at least 10 characters long')
    .escape(),

  body('author')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Author name must be between 2 and 100 characters')
    .escape(),

  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),

  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each tag must be between 1 and 50 characters')
    .escape(),

  body('published')
    .optional()
    .isBoolean()
    .withMessage('Published must be a boolean value')
];

/**
 * Validation rules for getting a single post
 */


const getPostValidation = [
  param('id')
    .notEmpty()
    .withMessage('Post ID is required')
    .isMongoId()
    .withMessage('Invalid post ID format')
];

/**
 * Validation rules for listing posts
 */


const listPostsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),

  query('sort')
    .optional()
    .isIn(['createdAt', '-createdAt', 'title', '-title', 'updatedAt', '-updatedAt'])
    .withMessage('Invalid sort field. Allowed: createdAt, -createdAt, title, -title, updatedAt, -updatedAt'),

  query('published')
    .optional()
    .isBoolean()
    .withMessage('Published must be a boolean value')
    .toBoolean(),

  query('author')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Author filter must be between 1 and 100 characters')
    .escape(),

  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Search query must be between 1 and 200 characters')
    .escape(),

  query('tags')
    .optional()
    .customSanitizer((value) => {
      if (typeof value === 'string') {
        return value.trim();
      }
      if (Array.isArray(value)) {
        return value.map(tag => typeof tag === 'string' ? tag.trim() : '').filter(tag => tag.length > 0);
      }
      return [];
    })
    .custom((value) => {
      if (typeof value === 'string') {
        return value.length > 0 && value.length <= 50;
      }
      if (Array.isArray(value)) {
        return value.every(tag => typeof tag === 'string' && tag.length > 0 && tag.length <= 50);
      }
      return false;
    })
    .withMessage('Tags must be a string or array of strings (max 50 chars each)')
];

/**
 * Validation rules for deleting a post
 */


const deletePostValidation = [
  param('id')
    .notEmpty()
    .withMessage('Post ID is required')
    .isMongoId()
    .withMessage('Invalid post ID format')
];

module.exports = {
  createPostValidation,
  updatePostValidation,
  getPostValidation,
  listPostsValidation,
  deletePostValidation
};
