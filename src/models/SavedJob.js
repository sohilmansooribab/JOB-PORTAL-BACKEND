const mongoose = require('mongoose');

const savedJobSchema = new mongoose.Schema(
  {
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

savedJobSchema.index({ candidate: 1, job: 1 }, { unique: true });

const SavedJob = mongoose.model('SavedJob', savedJobSchema);
module.exports = SavedJob;
