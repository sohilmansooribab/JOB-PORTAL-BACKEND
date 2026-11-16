const User = require('../models/User');
const Job = require('../models/Job');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const path = require('path');

/**
 * @desc    Get user profile by ID
 * @route   GET /api/v1/users/:id
 * @access  Private
 */
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  return ApiResponse.success(res, { user }, 'User profile retrieved');
});

/**
 * @desc    Update basic user info (name, phone, location)
 * @route   PUT /api/v1/users/profile/basic
 * @access  Private
 */
const updateProfileBasic = asyncHandler(async (req, res) => {
  const { name, phone, location } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (location !== undefined) user.location = location;

  await user.save();

  return ApiResponse.success(res, { user }, 'Basic profile updated successfully');
});

/**
 * @desc    Update Candidate Profile
 * @route   PUT /api/v1/users/profile/candidate
 * @access  Private (Candidate only)
 */
const updateCandidateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  if (user.role !== 'candidate') {
    throw ApiError.forbidden('Only candidate accounts have candidate profiles.');
  }

  const {
    headline,
    bio,
    skills,
    experienceYears,
    education,
    experience,
    githubUrl,
    linkedinUrl,
    portfolioUrl,
  } = req.body;

  user.candidateProfile = {
    ...user.candidateProfile.toObject(),
    ...(headline !== undefined && { headline }),
    ...(bio !== undefined && { bio }),
    ...(skills !== undefined && { skills }),
    ...(experienceYears !== undefined && { experienceYears }),
    ...(education !== undefined && { education }),
    ...(experience !== undefined && { experience }),
    ...(githubUrl !== undefined && { githubUrl }),
    ...(linkedinUrl !== undefined && { linkedinUrl }),
    ...(portfolioUrl !== undefined && { portfolioUrl }),
  };

  await user.save();

  return ApiResponse.success(res, { user }, 'Candidate profile updated successfully');
});

/**
 * @desc    Update Recruiter / Company Profile
 * @route   PUT /api/v1/users/profile/recruiter
 * @access  Private (Recruiter only)
 */
const updateRecruiterProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  if (user.role !== 'recruiter') {
    throw ApiError.forbidden('Only recruiter accounts have recruiter company profiles.');
  }

  const {
    companyName,
    companyWebsite,
    companyDescription,
    industry,
    companySize,
    location,
  } = req.body;

  user.recruiterProfile = {
    ...user.recruiterProfile.toObject(),
    ...(companyName !== undefined && { companyName }),
    ...(companyWebsite !== undefined && { companyWebsite }),
    ...(companyDescription !== undefined && { companyDescription }),
    ...(industry !== undefined && { industry }),
    ...(companySize !== undefined && { companySize }),
    ...(location !== undefined && { location }),
  };

  await user.save();

  return ApiResponse.success(res, { user }, 'Recruiter company profile updated successfully');
});

/**
 * @desc    Upload candidate resume
 * @route   POST /api/v1/users/upload-resume
 * @access  Private (Candidate only)
 */
const uploadResume = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw ApiError.badRequest('Please upload a resume file (PDF, DOC, or DOCX).');
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  if (user.role !== 'candidate') {
    throw ApiError.forbidden('Only candidate accounts can upload resumes.');
  }

  const resumeUrl = `/uploads/resumes/${req.file.filename}`;
  user.candidateProfile.resumeUrl = resumeUrl;
  user.candidateProfile.resumeOriginalName = req.file.originalname;

  await user.save();

  return ApiResponse.success(
    res,
    {
      resumeUrl,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      fileSize: req.file.size,
    },
    'Resume uploaded successfully'
  );
});

/**
 * @desc    Upload user avatar or company logo
 * @route   POST /api/v1/users/upload-avatar
 * @access  Private
 */
const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw ApiError.badRequest('Please upload an image file (JPEG, PNG, or WEBP).');
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  const avatarUrl = `/uploads/avatars/${req.file.filename}`;
  user.avatar = avatarUrl;

  // If recruiter, also update companyLogo if empty
  if (user.role === 'recruiter' && !user.recruiterProfile?.companyLogo) {
    user.recruiterProfile.companyLogo = avatarUrl;
  }

  await user.save();

  return ApiResponse.success(
    res,
    {
      avatarUrl,
      fileName: req.file.filename,
    },
    'Avatar uploaded successfully'
  );
});

/**
 * @desc    Get recruiter company public profile with active jobs
 * @route   GET /api/v1/users/recruiter/:id
 * @access  Public
 */
const getRecruiterPublicProfile = asyncHandler(async (req, res) => {
  const recruiter = await User.findOne({
    _id: req.params.id,
    role: 'recruiter',
    isBlocked: false,
  }).select('name email avatar phone location recruiterProfile createdAt');

  if (!recruiter) {
    throw ApiError.notFound('Recruiter or company not found');
  }

  const activeJobs = await Job.find({
    recruiter: recruiter._id,
    status: 'Active',
  }).sort({ createdAt: -1 });

  return ApiResponse.success(
    res,
    {
      recruiter,
      activeJobsCount: activeJobs.length,
      jobs: activeJobs,
    },
    'Recruiter profile retrieved'
  );
});

module.exports = {
  getUserProfile,
  updateProfileBasic,
  updateCandidateProfile,
  updateRecruiterProfile,
  uploadResume,
  uploadAvatar,
  getRecruiterPublicProfile,
};
