const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Protect routes - Verifies JWT from header or cookie
 * Checks if user still exists and is not blocked
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // 1. Check Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // 2. Check cookies
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    throw ApiError.unauthorized('Authentication token missing. Please log in.');
  }

  // 3. Verify token
  let decoded;
  try {
    const secret = process.env.JWT_SECRET || 'job_portal_super_secret_jwt_key_2026_secure';
    decoded = jwt.verify(token, secret);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Token expired. Please log in again.');
    }
    throw ApiError.unauthorized('Invalid authentication token.');
  }

  // 4. Check if user exists
  const user = await User.findById(decoded.id);
  if (!user) {
    throw ApiError.unauthorized('The user belonging to this token no longer exists.');
  }

  // 5. Check if user is blocked
  if (user.isBlocked) {
    throw ApiError.forbidden('Your account has been suspended by an administrator.');
  }

  // Grant access
  req.user = user;
  next();
});

/**
 * Optional authentication - If token is provided, attach user; otherwise proceed as guest
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return next();
  }

  try {
    const secret = process.env.JWT_SECRET || 'job_portal_super_secret_jwt_key_2026_secure';
    const decoded = jwt.verify(token, secret);
    const user = await User.findById(decoded.id);
    if (user && !user.isBlocked) {
      req.user = user;
    }
  } catch {
    // Silently continue without user
  }

  next();
});

module.exports = {
  protect,
  optionalAuth,
};
