const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
      maxlength: [150, 'Job title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Job description is required'],
      trim: true,
    },
    recruiter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recruiter is required'],
      index: true,
    },
    company: {
      name: { type: String, required: true, trim: true },
      logo: { type: String, default: '' },
      website: { type: String, default: '' },
      location: { type: String, default: '' },
    },
    location: {
      type: String,
      required: [true, 'Job location is required'],
      trim: true,
    },
    workplaceType: {
      type: String,
      enum: ['Remote', 'On-site', 'Hybrid'],
      default: 'Remote',
    },
    jobType: {
      type: String,
      enum: ['Full-time', 'Part-time', 'Contract', 'Internship'],
      default: 'Full-time',
    },
    experienceLevel: {
      type: String,
      enum: ['Entry Level', 'Mid Level', 'Senior Level', 'Lead / Principal'],
      default: 'Mid Level',
    },
    category: {
      type: String,
      required: [true, 'Job category is required'],
      trim: true,
      default: 'Engineering',
    },
    salary: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
      currency: { type: String, default: 'USD' },
      isNegotiable: { type: Boolean, default: false },
    },
    skillsRequired: [
      {
        type: String,
        trim: true,
      },
    ],
    responsibilities: [
      {
        type: String,
        trim: true,
      },
    ],
    requirements: [
      {
        type: String,
        trim: true,
      },
    ],
    benefits: [
      {
        type: String,
        trim: true,
      },
    ],
    status: {
      type: String,
      enum: ['Active', 'Closed', 'Draft'],
      default: 'Active',
      index: true,
    },
    applicationsCount: {
      type: Number,
      default: 0,
    },
    viewsCount: {
      type: Number,
      default: 0,
    },
    deadline: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast searching and filtering
jobSchema.index({ title: 'text', description: 'text', 'company.name': 'text', skillsRequired: 'text' });
jobSchema.index({ status: 1, createdAt: -1 });
jobSchema.index({ category: 1, status: 1 });
jobSchema.index({ workplaceType: 1, jobType: 1, experienceLevel: 1 });

const Job = mongoose.model('Job', jobSchema);
module.exports = Job;
