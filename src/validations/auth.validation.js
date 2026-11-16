const { z } = require('zod');

const registerSchema = {
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters long').max(100),
    email: z.string().email('Please provide a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    role: z.enum(['candidate', 'recruiter', 'admin']).default('candidate'),
    phone: z.string().optional(),
    location: z.string().optional(),
  }),
};

const loginSchema = {
  body: z.object({
    email: z.string().email('Please provide a valid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
};

const changePasswordSchema = {
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters long'),
  }),
};

module.exports = {
  registerSchema,
  loginSchema,
  changePasswordSchema,
};
