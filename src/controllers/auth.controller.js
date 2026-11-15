   const User = require('../models/User');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

// Helper to attach JWT cookie and format user response
const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  const token = user.generateAuthToken();

  const cookieExpireDays = parseInt(process.env.JWT_COOKIE_EXPIRES_IN || '7', 10);
  const cookieOptions = {
    expires: new Date(Date.now() + cookieExpireDays * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  };

  res.cookie('token', token, cookieOptions);

  return res.status(statusCode).json(
    new ApiResponse(
      statusCode,
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          phone: user.phone,
          location: user.location,
          isBlocked: user.isBlocked,
          candidateProfile: user.candidateProfile,
          recruiterProfile: user.recruiterProfile,
          createdAt: user.createdAt,
        },
        token,
      },
      message
    )
  );
};

/**
 * @desc    Register a new user
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone, location } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw ApiError.conflict('An account with this email address already exists.');
  }

  // Prevent direct public admin creation unless no users exist
  let assignedRole = role || 'candidate';
  if (assignedRole === 'admin') {
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      throw ApiError.forbidden('Admin accounts cannot be registered publicly.');
    }
  }

  const user = await User.create({
    name,
    email,
    password,
    role: assignedRole,
    phone,
    location,
  });

  return sendTokenResponse(user, 201, res, 'Registration successful');
});

/**
 * @desc    Login user
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user with password included
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password.');
  }

  // Check password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw ApiError.unauthorized('Invalid email or password.');
  }

  // Check if account is blocked
  if (user.isBlocked) {
    throw ApiError.forbidden('Your account has been suspended by an administrator.');
  }

  return sendTokenResponse(user, 200, res, 'Login successful');
});

/**
 * @desc    Logout user & clear cookie
 * @route   POST /api/v1/auth/logout
 * @access  Public
 */
const logout = asyncHandler(async (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 5 * 1000),
    httpOnly: true,
  });

  return ApiResponse.success(res, null, 'Logged out successfully');
});

/**
 * @desc    Get current authenticated user
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  return ApiResponse.success(res, { user }, 'Current user profile retrieved');
});

/**
 * @desc    Update current user's password
 * @route   PUT /api/v1/auth/update-password
 * @access  Private
 */
const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw ApiError.badRequest('Current password does not match.');
  }

  user.password = newPassword;
  await user.save();

  return sendTokenResponse(user, 200, res, 'Password updated successfully');
});

module.exports = {
  register,
  login,
  logout,
  getMe,
  updatePassword,
};
