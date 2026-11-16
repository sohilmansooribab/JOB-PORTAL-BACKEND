const ApiError = require('../utils/apiError');

/**
 * Restrict access to specified roles
 * @param {...string} roles - e.g. 'candidate', 'recruiter', 'admin'
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('User must be authenticated.'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `User role '${req.user.role}' is not authorized to access this resource. Allowed roles: ${roles.join(', ')}`
        )
      );
    }

    next();
  };
};

module.exports = {
  authorize,
};
