import {
  createClassSchema,
  updateClassSchema,
} from '../../src/modules/classes/classes.validator';
import { CUID } from '../helpers';

describe('classes feature — validation', () => {
  const valid = { name: 'Class 9', section: 'A', academicYear: '2025-2026', teacherId: CUID };

  it('accepts a valid class', () => {
    expect(createClassSchema.safeParse(valid).success).toBe(true);
  });

  it('requires a name and a 4+ char academic year', () => {
    expect(createClassSchema.safeParse({ ...valid, name: '' }).success).toBe(false);
    expect(createClassSchema.safeParse({ ...valid, academicYear: '25' }).success).toBe(false);
  });

  it('rejects a non-positive capacity', () => {
    expect(createClassSchema.safeParse({ ...valid, capacity: 0 }).success).toBe(false);
    expect(createClassSchema.safeParse({ ...valid, capacity: 40 }).success).toBe(true);
  });

  it('allows empty partial updates', () => {
    expect(updateClassSchema.safeParse({}).success).toBe(true);
  });
});
