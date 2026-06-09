import { z } from 'zod';

export const broadcastSchema = z.object({
  targetGroup: z.enum(['all_parents', 'all_teachers', 'all_students', 'specific_class', 'specific_role']),
  classId: z.string().optional(),
  role: z.enum(['teacher', 'parent', 'student', 'finance']).optional(),
  subject: z.string().min(1, 'Subject is required'),
  message: z.string().min(1, 'Message is required'),
  channels: z.array(z.enum(['email', 'sms', 'in_app'])).min(1, 'Select at least one channel'),
  variables: z.record(z.string()).optional(),
});

export const notifyStudentsSchema = z.object({
  studentIds: z.array(z.string().cuid()).min(1),
  subject: z.string().min(1),
  message: z.string().min(1),
  channels: z.array(z.enum(['email', 'sms', 'in_app'])).min(1),
});

export type BroadcastInput = z.infer<typeof broadcastSchema>;
export type NotifyStudentsInput = z.infer<typeof notifyStudentsSchema>;
