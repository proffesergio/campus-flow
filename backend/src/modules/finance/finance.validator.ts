import { z } from 'zod';

export const createFeeStructureSchema = z.object({
  name: z.string().min(1).max(150),
  classId: z.string().cuid().optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  amount: z.number().positive(),
  currency: z.string().default('BDT'),
  frequency: z.enum(['monthly', 'quarterly', 'annual', 'one_time']),
  feeType: z.enum(['tuition', 'exam', 'admission', 'transport', 'library', 'other']),
  academicYear: z.string().min(1),
  dueDay: z.number().int().min(1).max(31).optional().nullable(),
});

export const updateFeeStructureSchema = createFeeStructureSchema.partial();

export const createInvoiceSchema = z.object({
  studentId: z.string().cuid(),
  feeStructureId: z.string().cuid().optional().nullable(),
  title: z.string().min(1).max(200),
  amount: z.number().positive(),
  currency: z.string().default('BDT'),
  dueDate: z.string().datetime(),
  notes: z.string().max(500).optional().nullable(),
});

export const bulkGenerateSchema = z.object({
  classId: z.string().cuid(),
  feeStructureId: z.string().cuid(),
  dueDate: z.string().datetime(),
  notes: z.string().max(500).optional().nullable(),
});

export const payCashSchema = z.object({
  paidAmount: z.number().positive(),
  notes: z.string().max(500).optional().nullable(),
});

export const invoiceListQuerySchema = z.object({
  studentId: z.string().cuid().optional(),
  classId: z.string().cuid().optional(),
  status: z.enum(['pending', 'paid', 'partial', 'overdue', 'waived']).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const stripeIntentSchema = z.object({
  invoiceId: z.string().cuid(),
});

export const sslCommerzInitSchema = z.object({
  invoiceId: z.string().cuid(),
  returnUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

export type CreateFeeStructureInput = z.infer<typeof createFeeStructureSchema>;
export type UpdateFeeStructureInput = z.infer<typeof updateFeeStructureSchema>;
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type BulkGenerateInput = z.infer<typeof bulkGenerateSchema>;
export type PayCashInput = z.infer<typeof payCashSchema>;
export type InvoiceListQuery = z.infer<typeof invoiceListQuerySchema>;
export type StripeIntentInput = z.infer<typeof stripeIntentSchema>;
export type SSLCommerzInitInput = z.infer<typeof sslCommerzInitSchema>;
