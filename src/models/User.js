const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const educationSchema = new mongoose.Schema(
  {
    degree: { type: String, trim: true },
    institution: { type: String, trim: true },
    fieldOfStudy: { type: String, trim: true },
    startYear: { type: Number },
    endYear: { type: Number },
  },
  { _id: false }
);

const experienceSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true },
    company: { type: String, trim: true },
    location: { type: String, trim: true },
    startDate: { type: Date },
    endDate: { type: Date },
    current: { type: Boolean, default: false },
    description: { type: String, trim: true },
  },
  { _id: false }
);

const candidateProfileSchema = new mongoose.Schema(
  {
    headline: { type: String, trim: true },
    bio: { type: String, trim: true },
    skills: [{ type: String, trim: true }],
    experienceYears: { type: Number, default: 0 },
    education: [educationSchema],
    experience: [experienceSchema],
    resumeUrl: { type: String, trim: true },
    resumeOriginalName: { type: String, trim: true },
    githubUrl: { type: String, trim: true },
    linkedinUrl: { type: String, trim: true },
    portfolioUrl: { type: String, trim: true },
  },
  { _id: false }
);

const recruiterProfileSchema = new mongoose.Schema(
  {
    companyName: { type: String, trim: true },
    companyWebsite: { type: String, trim: true },
    companyDescription: { type: String, trim: true },
    companyLogo: { type: String, trim: true },
    industry: { type: String, trim: true },
    companySize: {
      type: String,
      enum: ['1-10', '11-50', '51-200', '201-500', '500+'],
      default: '1-10',
    },
    location: { type: String, trim: true },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false,
    },
    role: {
      type: String,
      enum: ['candidate', 'recruiter', 'admin'],
      default: 'candidate',
    },
    avatar: {
      type: String,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    candidateProfile: {
      type: candidateProfileSchema,
      default: () => ({}),
    },
    recruiterProfile: {
      type: recruiterProfileSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate JWT token method
userSchema.methods.generateAuthToken = function () {
  const secret = process.env.JWT_SECRET || 'job_portal_super_secret_jwt_key_2026_secure';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign(
    {
      id: this._id,
      role: this.role,
      email: this.email,
    },
    secret,
    { expiresIn }
  );
};

const User = mongoose.model('User', userSchema);
module.exports = User;
