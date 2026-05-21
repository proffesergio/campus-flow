import { z } from 'zod';

export const markAttendanceSchema = z.object({
  classId: z.string().cuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  records: z
    .array(
      z.object({
        studentId: z.string().cuid(),
        status: z.enum(['present', 'absent', 'late', 'excused']),
        note: z.string().max(200).optional(),
      }),
    )
    .min(1, 'At least one record required'),
});

export const attendanceQuerySchema = z.object({
  classId: z.string().cuid().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  studentId: z.string().cuid().optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(200).default(50),
});

export type MarkAttendanceInput = z.infer<typeof markAttendanceSchema>;
export type AttendanceQuery = z.infer<typeof attendanceQuerySchema>;
