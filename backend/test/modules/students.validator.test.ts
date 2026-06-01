import {
  createStudentSchema,
  updateStudentSchema,
  studentQuerySchema,
} from '../../src/modules/students/students.validator';
import { CUID } from '../helpers';

describe('students feature — validation', () => {
  const valid = {
    classId: CUID,
    firstName: 'Ayesha',
    lastName: 'Khan',
    guardianName: 'Nadia Khan',
    guardianPhone: '+8801712345678',
  };

  it('accepts a minimal valid student', () => {
    expect(createStudentSchema.safeParse(valid).success).toBe(true);
  });

  it('defaults createPortalAccess to false', () => {
    const parsed = createStudentSchema.parse(valid);
    expect(parsed.createPortalAccess).toBe(false);
  });

  it('rejects a non-CUID classId', () => {
    expect(createStudentSchema.safeParse({ ...valid, classId: '123' }).success).toBe(false);
  });

  it('requires a guardian name and phone', () => {
    expect(createStudentSchema.safeParse({ ...valid, guardianName: '' }).success).toBe(false);
    expect(createStudentSchema.safeParse({ ...valid, guardianPhone: '' }).success).toBe(false);
  });

  it('rejects an invalid photoUrl', () => {
    expect(createStudentSchema.safeParse({ ...valid, photoUrl: 'not-a-url' }).success).toBe(false);
  });

  it('allows partial updates including status', () => {
    expect(updateStudentSchema.safeParse({ status: 'graduated' }).success).toBe(true);
    expect(updateStudentSchema.safeParse({ status: 'expelled' }).success).toBe(false);
  });

  it('coerces and bounds the list query', () => {
    const parsed = studentQuerySchema.parse({ page: '2', limit: '50' });
    expect(parsed.page).toBe(2);
    expect(parsed.limit).toBe(50);
    expect(studentQuerySchema.safeParse({ limit: '500' }).success).toBe(false);
  });
});
