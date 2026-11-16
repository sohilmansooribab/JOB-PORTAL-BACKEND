const { z } = require('zod');

const createReportSchema = {
  body: z.object({
    targetType: z.enum(['Job', 'User']).default('Job'),
    targetJob: z.string().optional(),
    targetUser: z.string().optional(),
    reason: z.enum([
      'Scam or Fraud',
      'Misleading Information',
      'Discriminatory Content',
      'Harassment',
      'Spam',
      'Other',
    ]),
    description: z.string().max(1000).optional(),
  }),
};

const updateReportStatusSchema = {
  body: z.object({
    status: z.enum(['Pending', 'Reviewed', 'Resolved', 'Dismissed']),
    adminNotes: z.string().max(1000).optional(),
  }),
};

module.exports = {
  createReportSchema,
  updateReportStatusSchema,
};
