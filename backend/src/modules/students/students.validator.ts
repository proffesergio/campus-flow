import { z } from 'zod';

export const createStudentSchema = z.object({
  classId: z.string().cuid(),
  rollNumber: z.string().max(20).optional(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  dateOfBirth: z.string().datetime().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  photoUrl: z.string().url().optional(),
  address: z.string().max(500).optional(),
  contactPhone: z.string().max(20).optional(),
  guardianName: z.string().min(1).max(100),
  guardianPhone: z.string().min(1).max(20),
  guardianEmail: z.string().email().optional(),
  emergencyContact: z.string().max(20).optional(),
  bloodGroup: z.string().max(5).optional(),
  religion: z.string().max(50).optional(),
  enrollmentDate: z.string().datetime().optional(),
  createPortalAccess: z.boolean().optional().default(false),
  portalEmail: z.string().email().optional(),
});

export const updateStudentSchema = createStudentSchema
  .omit({ createPortalAccess: true, portalEmail: true })
  .extend({ status: z.enum(['active', 'inactive', 'graduated', 'transferred']).optional() })
  .partial();

export const studentQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  classId: z.string().optional(),
  status: z.enum(['active', 'inactive', 'graduated', 'transferred']).optional(),
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
export type StudentQuery = z.infer<typeof studentQuerySchema>;
