const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reporter is required'],
      index: true,
    },
    targetType: {
      type: String,
      enum: ['Job', 'User'],
      required: true,
      default: 'Job',
    },
    targetJob: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
    },
    targetUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reason: {
      type: String,
      required: [true, 'Reason is required'],
      enum: [
        'Scam or Fraud',
        'Misleading Information',
        'Discriminatory Content',
        'Harassment',
        'Spam',
        'Other',
      ],
      default: 'Scam or Fraud',
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    status: {
      type: String,
      enum: ['Pending', 'Reviewed', 'Resolved', 'Dismissed'],
      default: 'Pending',
      index: true,
    },
    adminNotes: {
      type: String,
      trim: true,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    resolvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

reportSchema.index({ status: 1, createdAt: -1 });

const Report = mongoose.model('Report', reportSchema);
module.exports = Report;
