const ApiError = require('../utils/apiError');

/**
 * 404 Not Found Middleware
 */
const notFound = (req, res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

/**
 * Global Error Handler Middleware
 */
const errorHandler = (err, req, res, next) => {
  let error = err;

  // If error is not an instance of ApiError, convert it
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || (error.status ? error.status : 500);
    const message = error.message || 'Internal Server Error';

    // Handle Zod Validation Error
    if (error.name === 'ZodError' || error.issues) {
      const messages = (error.issues || error.errors || []).map((err) => ({
        field: Array.isArray(err.path) ? err.path.join('.') : String(err.path || ''),
        message: err.message,
      }));
      error = ApiError.badRequest('Validation error', messages);
    }
    // Handle Mongoose Bad ObjectId (CastError)
    else if (error.name === 'CastError') {
      error = ApiError.badRequest(`Invalid resource identifier: ${error.value}`);
    }
    // Handle Mongoose Duplicate Key Error (Code 11000)
    else if (error.code === 11000) {
      const field = Object.keys(error.keyValue || {})[0] || 'field';
      error = ApiError.conflict(`Duplicate value for '${field}'. This value is already in use.`);
    }
    // Handle Mongoose Validation Error
    else if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors || {}).map((val) => ({
        field: val.path,
        message: val.message,
      }));
      error = ApiError.badRequest('Validation error', messages);
    }
    // Handle JWT Error
    else if (error.name === 'JsonWebTokenError') {
      error = ApiError.unauthorized('Invalid authentication token.');
    }
    // Handle JWT Token Expired
    else if (error.name === 'TokenExpiredError') {
      error = ApiError.unauthorized('Authentication token has expired.');
    }
    // Generic error
    else {
      error = new ApiError(statusCode, message, error.errors || [], err.stack);
    }
  }

  const response = {
    success: false,
    statusCode: error.statusCode,
    message: error.message,
    ...(error.errors && error.errors.length > 0 && { errors: error.errors }),
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  };

  if (process.env.NODE_ENV === 'development' && error.statusCode >= 500) {
    console.error('[Error Logger]', err);
  }

  res.status(error.statusCode).json(response);
};

module.exports = {
  notFound,
  errorHandler,
};
