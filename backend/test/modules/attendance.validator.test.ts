import {
  markAttendanceSchema,
  attendanceQuerySchema,
} from '../../src/modules/attendance/attendance.validator';
import { CUID, CUID2 } from '../helpers';

describe('attendance feature — validation', () => {
  const valid = {
    classId: CUID,
    date: '2026-06-01',
    records: [{ studentId: CUID2, status: 'present' as const }],
  };

  it('accepts a valid attendance submission', () => {
    expect(markAttendanceSchema.safeParse(valid).success).toBe(true);
  });

  it('enforces YYYY-MM-DD dates', () => {
    expect(markAttendanceSchema.safeParse({ ...valid, date: '01-06-2026' }).success).toBe(false);
    expect(markAttendanceSchema.safeParse({ ...valid, date: '2026-6-1' }).success).toBe(false);
  });

  it('requires at least one record', () => {
    expect(markAttendanceSchema.safeParse({ ...valid, records: [] }).success).toBe(false);
  });

  it('rejects an invalid status value', () => {
    const bad = { ...valid, records: [{ studentId: CUID2, status: 'holiday' }] };
    expect(markAttendanceSchema.safeParse(bad).success).toBe(false);
  });

  it('accepts a month filter in the query', () => {
    expect(attendanceQuerySchema.safeParse({ month: '2026-06' }).success).toBe(true);
    expect(attendanceQuerySchema.safeParse({ month: '2026-13-01' }).success).toBe(false);
  });
});
