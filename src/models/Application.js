const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: [true, 'Job reference is required'],
      index: true,
    },
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Candidate reference is required'],
      index: true,
    },
    recruiter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recruiter reference is required'],
      index: true,
    },
    resumeUrl: {
      type: String,
      required: [true, 'Resume is required for application'],
    },
    resumeOriginalName: {
      type: String,
    },
    coverLetter: {
      type: String,
      trim: true,
      maxlength: [3000, 'Cover letter cannot exceed 3000 characters'],
    },
    status: {
      type: String,
      enum: ['Pending', 'Reviewing', 'Shortlisted', 'Rejected', 'Accepted'],
      default: 'Pending',
      index: true,
    },
    recruiterNotes: {
      type: String,
      trim: true,
      select: false, // Hidden from candidate unless shared
    },
    feedback: {
      type: String,
      trim: true,
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
    statusUpdatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate applications by the same candidate for the same job
applicationSchema.index({ job: 1, candidate: 1 }, { unique: true });
applicationSchema.index({ candidate: 1, createdAt: -1 });
applicationSchema.index({ recruiter: 1, status: 1 });

const Application = mongoose.model('Application', applicationSchema);
module.exports = Application;
