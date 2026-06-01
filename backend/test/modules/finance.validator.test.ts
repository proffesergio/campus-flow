import {
  createFeeStructureSchema,
  createInvoiceSchema,
  payCashSchema,
  invoiceListQuerySchema,
} from '../../src/modules/finance/finance.validator';
import { CUID, ISO_DATE } from '../helpers';

describe('finance feature — validation', () => {
  it('defaults fee currency to BDT', () => {
    const parsed = createFeeStructureSchema.parse({
      name: 'Monthly Tuition',
      amount: 3000,
      frequency: 'monthly',
      feeType: 'tuition',
      academicYear: '2025-2026',
    });
    expect(parsed.currency).toBe('BDT');
  });

  it('rejects a non-positive fee amount', () => {
    expect(
      createFeeStructureSchema.safeParse({
        name: 'X',
        amount: -1,
        frequency: 'monthly',
        feeType: 'tuition',
        academicYear: '2025',
      }).success,
    ).toBe(false);
  });

  it('bounds dueDay to 1..31', () => {
    const base = {
      name: 'X',
      amount: 1,
      frequency: 'monthly' as const,
      feeType: 'tuition' as const,
      academicYear: '2025',
    };
    expect(createFeeStructureSchema.safeParse({ ...base, dueDay: 31 }).success).toBe(true);
    expect(createFeeStructureSchema.safeParse({ ...base, dueDay: 32 }).success).toBe(false);
  });

  it('accepts a valid invoice', () => {
    expect(
      createInvoiceSchema.safeParse({
        studentId: CUID,
        title: 'June Tuition',
        amount: 3000,
        dueDate: ISO_DATE,
      }).success,
    ).toBe(true);
  });

  it('rejects an invoice with a non-ISO dueDate', () => {
    expect(
      createInvoiceSchema.safeParse({
        studentId: CUID,
        title: 'June Tuition',
        amount: 3000,
        dueDate: '2026-06-01',
      }).success,
    ).toBe(false);
  });

  it('requires a positive cash payment', () => {
    expect(payCashSchema.safeParse({ paidAmount: 500 }).success).toBe(true);
    expect(payCashSchema.safeParse({ paidAmount: 0 }).success).toBe(false);
  });

  it('rejects unknown invoice statuses in the list query', () => {
    expect(invoiceListQuerySchema.safeParse({ status: 'paid' }).success).toBe(true);
    expect(invoiceListQuerySchema.safeParse({ status: 'cancelled' }).success).toBe(false);
  });
});
