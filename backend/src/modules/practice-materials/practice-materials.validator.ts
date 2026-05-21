import { z } from 'zod';

export const createMaterialSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  type: z.enum(['pdf', 'link', 'video', 'note']),
  fileUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  externalUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  classId: z.string().optional().nullable(),
  subjectId: z.string().optional().nullable(),
  isPublished: z.boolean().default(true),
});

export const updateMaterialSchema = createMaterialSchema.partial();

export const materialQuerySchema = z.object({
  search: z.string().optional(),
  classId: z.string().optional(),
  subjectId: z.string().optional(),
  type: z.enum(['pdf', 'link', 'video', 'note']).optional(),
  publishedOnly: z.coerce.boolean().default(false),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateMaterialInput = z.infer<typeof createMaterialSchema>;
export type UpdateMaterialInput = z.infer<typeof updateMaterialSchema>;
export type MaterialQuery       = z.infer<typeof materialQuerySchema>;
