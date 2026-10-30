const { z } = require('zod');

const createJobSchema = {
  body: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters long').max(150),
    description: z.string().min(10, 'Description must be at least 10 characters long'),
    location: z.string().min(2, 'Location is required'),
    workplaceType: z.enum(['Remote', 'On-site', 'Hybrid']).default('Remote'),
    jobType: z.enum(['Full-time', 'Part-time', 'Contract', 'Internship']).default('Full-time'),
    experienceLevel: z
      .enum(['Entry Level', 'Mid Level', 'Senior Level', 'Lead / Principal'])
      .default('Mid Level'),
    category: z.string().min(2, 'Category is required'),
    salary: z
      .object({
        min: z.number().nonnegative().optional(),
        max: z.number().nonnegative().optional(),
        currency: z.string().default('USD'),
        isNegotiable: z.boolean().default(false),
      })
      .optional(),
    skillsRequired: z.array(z.string()).default([]),
    responsibilities: z.array(z.string()).optional(),
    requirements: z.array(z.string()).optional(),
    benefits: z.array(z.string()).optional(),
    deadline: z.string().or(z.date()).optional(),
    status: z.enum(['Active', 'Closed', 'Draft']).default('Active'),
  }),
};

const updateJobSchema = {
  body: z.object({
    title: z.string().min(3).max(150).optional(),
    description: z.string().min(10).optional(),
    location: z.string().min(2).optional(),
    workplaceType: z.enum(['Remote', 'On-site', 'Hybrid']).optional(),
    jobType: z.enum(['Full-time', 'Part-time', 'Contract', 'Internship']).optional(),
    experienceLevel: z
      .enum(['Entry Level', 'Mid Level', 'Senior Level', 'Lead / Principal'])
      .optional(),
    category: z.string().min(2).optional(),
    salary: z
      .object({
        min: z.number().nonnegative().optional(),
        max: z.number().nonnegative().optional(),
        currency: z.string().optional(),
        isNegotiable: z.boolean().optional(),
      })
      .optional(),
    skillsRequired: z.array(z.string()).optional(),
    responsibilities: z.array(z.string()).optional(),
    requirements: z.array(z.string()).optional(),
    benefits: z.array(z.string()).optional(),
    deadline: z.string().or(z.date()).optional(),
    status: z.enum(['Active', 'Closed', 'Draft']).optional(),
  }),
};

const jobQuerySchema = {
  query: z.object({
    search: z.string().optional(),
    category: z.string().optional(),
    workplaceType: z.string().optional(),
    jobType: z.string().optional(),
    experienceLevel: z.string().optional(),
    location: z.string().optional(),
    minSalary: z.string().or(z.number()).optional(),
    maxSalary: z.string().or(z.number()).optional(),
    page: z.string().or(z.number()).optional(),
    limit: z.string().or(z.number()).optional(),
    sort: z.string().optional(), // 'newest', 'oldest', 'salary_high', 'salary_low'
  }),
};

module.exports = {
  createJobSchema,
  updateJobSchema,
  jobQuerySchema,
};
