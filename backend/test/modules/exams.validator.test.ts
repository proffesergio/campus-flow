import {
  createExamSchema,
  bulkGradeSchema,
  examListQuerySchema,
} from '../../src/modules/exams/exams.validator';
import { CUID, CUID2, ISO_DATE } from '../helpers';

describe('exams feature — validation', () => {
  const validExam = {
    classId: CUID,
    subjectId: CUID2,
    name: 'Midterm Mathematics',
    examType: 'midterm' as const,
    examDate: ISO_DATE,
    totalMarks: 100,
    passingMarks: 40,
    term: 'Term 1',
  };

  it('accepts a valid exam', () => {
    expect(createExamSchema.safeParse(validExam).success).toBe(true);
  });

  it('rejects an unknown exam type', () => {
    expect(createExamSchema.safeParse({ ...validExam, examType: 'oral' }).success).toBe(false);
  });

  it('rejects non-positive total marks', () => {
    expect(createExamSchema.safeParse({ ...validExam, totalMarks: 0 }).success).toBe(false);
  });

  it('rejects a non-ISO exam date', () => {
    expect(createExamSchema.safeParse({ ...validExam, examDate: '2026-06-01' }).success).toBe(false);
  });

  it('accepts a bulk grade payload with at least one record', () => {
    const ok = bulkGradeSchema.safeParse({
      examId: CUID,
      grades: [{ studentId: CUID2, marksObtained: 88, isAbsent: false }],
    });
    expect(ok.success).toBe(true);
  });

  it('rejects an empty grades array', () => {
    expect(bulkGradeSchema.safeParse({ examId: CUID, grades: [] }).success).toBe(false);
  });

  it('defaults isAbsent to false per grade', () => {
    const parsed = bulkGradeSchema.parse({
      examId: CUID,
      grades: [{ studentId: CUID2, marksObtained: 50 }],
    });
    expect(parsed.grades[0]!.isAbsent).toBe(false);
  });

  it('paginates the exam list query with defaults', () => {
    const parsed = examListQuerySchema.parse({});
    expect(parsed.page).toBe(1);
    expect(parsed.limit).toBe(20);
  });
});
