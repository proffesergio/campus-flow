import { z } from 'zod';

export const registerSchoolSchema = z.object({
  schoolName: z.string().min(2).max(100),
  schoolSlug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only'),
  adminFirstName: z.string().min(1).max(50),
  adminLastName: z.string().min(1).max(50),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(8).max(100),
  adminPhone: z.string().optional(),
  timezone: z.string().optional(),
  locale: z.enum(['en', 'bn']).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type RegisterSchoolInput = z.infer<typeof registerSchoolSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
