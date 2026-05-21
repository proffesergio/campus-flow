import { z } from 'zod';

export const createClassSchema = z.object({
  name: z.string().min(1).max(100),
  section: z.string().max(20).optional(),
  academicYear: z.string().min(4).max(20),
  teacherId: z.string().cuid().optional(),
  capacity: z.number().int().positive().optional(),
});

export const updateClassSchema = createClassSchema.partial();

export type CreateClassInput = z.infer<typeof createClassSchema>;
export type UpdateClassInput = z.infer<typeof updateClassSchema>;
