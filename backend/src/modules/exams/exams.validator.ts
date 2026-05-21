import { z } from 'zod';

export const createSubjectSchema = z.object({
  classId: z.string().cuid(),
  name: z.string().min(1).max(100),
  code: z.string().max(20).optional(),
  teacherId: z.string().cuid().optional().nullable(),
  creditHours: z.number().int().min(1).max(20).optional(),
});

export const updateSubjectSchema = createSubjectSchema.partial().omit({ classId: true });

export const createExamSchema = z.object({
  classId: z.string().cuid(),
  subjectId: z.string().cuid(),
  name: z.string().min(1).max(200),
  examType: z.enum(['midterm', 'final', 'quiz', 'assignment', 'class_test']),
  examDate: z.string().datetime(),
  totalMarks: z.number().positive(),
  passingMarks: z.number().positive(),
  term: z.string().min(1).max(50),
});

export const updateExamSchema = createExamSchema
  .partial()
  .omit({ classId: true, subjectId: true });

export const bulkGradeSchema = z.object({
  examId: z.string().cuid(),
  grades: z
    .array(
      z.object({
        studentId: z.string().cuid(),
        marksObtained: z.number().min(0).optional().nullable(),
        isAbsent: z.boolean().default(false),
        remarks: z.string().max(500).optional().nullable(),
      }),
    )
    .min(1),
});

export const examListQuerySchema = z.object({
  classId: z.string().cuid().optional(),
  subjectId: z.string().cuid().optional(),
  term: z.string().optional(),
  examType: z
    .enum(['midterm', 'final', 'quiz', 'assignment', 'class_test'])
    .optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;
export type UpdateSubjectInput = z.infer<typeof updateSubjectSchema>;
export type CreateExamInput = z.infer<typeof createExamSchema>;
export type UpdateExamInput = z.infer<typeof updateExamSchema>;
export type BulkGradeInput = z.infer<typeof bulkGradeSchema>;
export type ExamListQuery = z.infer<typeof examListQuerySchema>;
