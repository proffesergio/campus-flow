import { z } from 'zod';

export const reportNarrativeSchema = z.object({
  studentId: z.string().min(1),
  term: z.string().min(1),
});

export const attendanceSummarySchema = z.object({
  studentId: z.string().min(1),
});

export const classInsightsSchema = z.object({
  classId: z.string().min(1),
  term: z.string().min(1),
});

export const adminQuerySchema = z.object({
  question: z.string().min(3).max(500),
});

export const studyChatSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().min(1),
  })).min(1).max(20),
});

export const practiceQuestionsSchema = z.object({
  subject: z.string().min(1),
  topic: z.string().min(1),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  count: z.coerce.number().int().min(1).max(20).default(5),
  studentClass: z.string().min(1),
});

export type ReportNarrativeInput    = z.infer<typeof reportNarrativeSchema>;
export type AttendanceSummaryInput  = z.infer<typeof attendanceSummarySchema>;
export type ClassInsightsInput      = z.infer<typeof classInsightsSchema>;
export type AdminQueryInput         = z.infer<typeof adminQuerySchema>;
export type PracticeQuestionsInput  = z.infer<typeof practiceQuestionsSchema>;
