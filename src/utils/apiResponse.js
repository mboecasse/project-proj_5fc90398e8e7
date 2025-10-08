// File: src/utils/apiResponse.js
// Generated: 2025-10-08 14:26:20 UTC
// Project ID: proj_5fc90398e8e7
// Task ID: task_6rjef20dc7e2

* @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {String} message - Success message
 * @param {Number} statusCode - HTTP status code (default: 200)
 */


const success = (res, data = null, message = 'Success', statusCode = 200) => {
  const response = {
    success: true,
    message
  };

  if (data !== null) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

/**
 * Sanitize error message for production
 * @param {String} error - Error message
 * @param {String} code - Error code
 * @returns {Object} - Sanitized error details
 */


const sanitizeError = (error, code) => {
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    // In production, return generic messages for server errors
    if (!code || code === 'SERVER_ERROR') {
      return {
        error: 'An error occurred while processing your request',
        code: 'SERVER_ERROR'
      };
    }
    // For client errors, sanitize but keep the message
    return {
      error: typeof error === 'string' ? error : 'An error occurred',
      code
    };
  }

  return { error, code };
};

/**
 * Error response
 * @param {Object} res - Express response object
 * @param {String} error - Error message
 * @param {Number} statusCode - HTTP status code (default: 500)
 * @param {String} code - Error code (optional)
 */


const error = (res, error = 'Internal Server Error', statusCode = 500, code = null) => {
  const sanitized = sanitizeError(error, code);

  const response = {
    success: false,
    error: sanitized.error
  };

  if (sanitized.code) {
    response.code = sanitized.code;
  }

  return res.status(statusCode).json(response);
};

/**
 * Paginated response
 * @param {Object} res - Express response object
 * @param {Array} data - Array of items
 * @param {Number} page - Current page number
 * @param {Number} limit - Items per page
 * @param {Number} total - Total number of items
 * @param {String} message - Success message
 */


const paginated = (res, data, page, limit, total, message = 'Success') => {
  // Input validation
  const parsedPage = parseInt(page);
  const parsedLimit = parseInt(limit);
  const parsedTotal = parseInt(total);

  // Validate page
  if (isNaN(parsedPage) || parsedPage < 1) {
    return error(res, 'Invalid page number. Must be a positive integer.', 400, 'INVALID_PAGE');
  }

  // Validate limit
  if (isNaN(parsedLimit) || parsedLimit < 1) {
    return error(res, 'Invalid limit. Must be a positive integer.', 400, 'INVALID_LIMIT');
  }

  // Validate total
  if (isNaN(parsedTotal) || parsedTotal < 0) {
    return error(res, 'Invalid total. Must be a non-negative integer.', 400, 'INVALID_TOTAL');
  }

  // Calculate pagination with safe division
  const totalPages = parsedTotal === 0 ? 0 : Math.ceil(parsedTotal / parsedLimit);
  const hasNextPage = parsedPage < totalPages;
  const hasPrevPage = parsedPage > 1;

  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      page: parsedPage,
      limit: parsedLimit,
      total: parsedTotal,
      totalPages,
      hasNextPage,
      hasPrevPage
    }
  });
};

/**
 * Created response (201)
 * @param {Object} res - Express response object
 * @param {*} data - Created resource data
 * @param {String} message - Success message
 */


const created = (res, data, message = 'Resource created successfully') => {
  return success(res, data, message, 201);
};

/**
 * No content response (204)
 * @param {Object} res - Express response object
 */


const noContent = (res) => {
  return res.status(204).send();
};

/**
 * Bad request response (400)
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 * @param {String} code - Error code
 */


const badRequest = (res, message = 'Bad request', code = 'BAD_REQUEST') => {
  return error(res, message, 400, code);
};

/**
 * Unauthorized response (401)
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 * @param {String} code - Error code
 */


const unauthorized = (res, message = 'Unauthorized', code = 'UNAUTHORIZED') => {
  return error(res, message, 401, code);
};

/**
 * Forbidden response (403)
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 * @param {String} code - Error code
 */


const forbidden = (res, message = 'Forbidden', code = 'FORBIDDEN') => {
  return error(res, message, 403, code);
};

/**
 * Not found response (404)
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 * @param {String} code - Error code
 */


const notFound = (res, message = 'Resource not found', code = 'NOT_FOUND') => {
  return error(res, message, 404, code);
};

/**
 * Conflict response (409)
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 * @param {String} code - Error code
 */


const conflict = (res, message = 'Resource conflict', code = 'CONFLICT') => {
  return error(res, message, 409, code);
};

/**
 * Validation error response (422)
 * @param {Object} res - Express response object
 * @param {Array|Object} errors - Validation errors
 * @param {String} message - Error message
 */


const validationError = (res, errors, message = 'Validation failed') => {
  const isProduction = process.env.NODE_ENV === 'production';

  return res.status(422).json({
    success: false,
    error: message,
    code: 'VALIDATION_ERROR',
    errors: isProduction && errors && typeof errors === 'object' ? errors : errors
  });
};

/**
 * Internal server error response (500)
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 */


const serverError = (res, message = 'Internal server error') => {
  return error(res, message, 500, 'SERVER_ERROR');
};

module.exports = {
  success,
  error,
  paginated,
  created,
  noContent,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  validationError,
  serverError
};
