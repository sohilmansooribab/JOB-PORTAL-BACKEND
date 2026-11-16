const { z } = require('zod');

const applyJobSchema = {
  body: z.object({
    coverLetter: z.string().max(3000).optional(),
    resumeUrl: z.string().optional(),
    resumeOriginalName: z.string().optional(),
  }),
};

const updateApplicationStatusSchema = {
  body: z.object({
    status: z.enum(['Pending', 'Reviewing', 'Shortlisted', 'Rejected', 'Accepted']),
    feedback: z.string().max(1000).optional(),
    recruiterNotes: z.string().max(1000).optional(),
  }),
};

module.exports = {
  applyJobSchema,
  updateApplicationStatusSchema,
};
