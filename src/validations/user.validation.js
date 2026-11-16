const { z } = require('zod');

const updateProfileBasicSchema = {
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    phone: z.string().optional(),
    location: z.string().optional(),
  }),
};

const educationItemSchema = z.object({
  degree: z.string().min(1, 'Degree is required'),
  institution: z.string().min(1, 'Institution is required'),
  fieldOfStudy: z.string().optional(),
  startYear: z.number().int().optional(),
  endYear: z.number().int().optional(),
});

const experienceItemSchema = z.object({
  title: z.string().min(1, 'Job title is required'),
  company: z.string().min(1, 'Company name is required'),
  location: z.string().optional(),
  startDate: z.string().or(z.date()).optional(),
  endDate: z.string().or(z.date()).optional(),
  current: z.boolean().default(false),
  description: z.string().optional(),
});

const updateCandidateProfileSchema = {
  body: z.object({
    headline: z.string().max(200).optional(),
    bio: z.string().max(2000).optional(),
    skills: z.array(z.string()).optional(),
    experienceYears: z.number().min(0).optional(),
    education: z.array(educationItemSchema).optional(),
    experience: z.array(experienceItemSchema).optional(),
    githubUrl: z.string().url().or(z.literal('')).optional(),
    linkedinUrl: z.string().url().or(z.literal('')).optional(),
    portfolioUrl: z.string().url().or(z.literal('')).optional(),
  }),
};

const updateRecruiterProfileSchema = {
  body: z.object({
    companyName: z.string().min(1, 'Company name is required').max(150),
    companyWebsite: z.string().url().or(z.literal('')).optional(),
    companyDescription: z.string().max(3000).optional(),
    industry: z.string().optional(),
    companySize: z.enum(['1-10', '11-50', '51-200', '201-500', '500+']).optional(),
    location: z.string().optional(),
  }),
};

module.exports = {
  updateProfileBasicSchema,
  updateCandidateProfileSchema,
  updateRecruiterProfileSchema,
};
