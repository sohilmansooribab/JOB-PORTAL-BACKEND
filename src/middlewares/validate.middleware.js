const ApiError = require('../utils/apiError');

/**
 * Validate request using a Zod schema
 * @param {object} schema - Zod schema or object containing { body, query, params }
 */
const validate = (schema) => (req, res, next) => {
  try {
    if (schema.body) {
      req.body = schema.body.parse(req.body);
    }
    if (schema.query) {
      req.query = schema.query.parse(req.query);
    }
    if (schema.params) {
      req.params = schema.params.parse(req.params);
    }

    // Direct schema fallback if not wrapped in { body, query, params }
    if (!schema.body && !schema.query && !schema.params && typeof schema.parse === 'function') {
      req.body = schema.parse(req.body);
    }

    next();
  } catch (error) {
    if (error.errors && Array.isArray(error.errors)) {
      const formattedErrors = error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return next(ApiError.badRequest('Validation error', formattedErrors));
    }
    next(error);
  }
};

module.exports = validate;
