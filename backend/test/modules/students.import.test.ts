import { resolveClassId, validateImportRow } from '../../src/modules/students/students.import';

const classes = [
  { id: 'c1', name: 'Class 6', section: 'A' },
  { id: 'c2', name: 'Class 6', section: null },
  { id: 'c3', name: 'Class 7', section: null },
];

describe('resolveClassId', () => {
  it('matches by name + section, case-insensitively', () => {
    expect(resolveClassId(classes, 'class 6', 'a')).toBe('c1');
  });
  it('matches name with empty section to the null-section class', () => {
    expect(resolveClassId(classes, 'Class 6', '')).toBe('c2');
    expect(resolveClassId(classes, 'Class 7', undefined)).toBe('c3');
  });
  it('returns null when no match', () => {
    expect(resolveClassId(classes, 'Class 9', '')).toBeNull();
  });
});

describe('validateImportRow', () => {
  it('returns a normalized create input for a valid row', () => {
    const r = validateImportRow(
      { firstName: 'Ali', lastName: 'Khan', className: 'Class 6', section: 'A', guardianName: 'Mr Khan', guardianPhone: '0171' },
      classes,
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.classId).toBe('c1');
      expect(r.value.firstName).toBe('Ali');
      expect(r.value.guardianPhone).toBe('0171');
    }
  });
  it('fails when a required field is missing', () => {
    const r = validateImportRow({ firstName: '', lastName: 'X', className: 'Class 6', section: 'A', guardianName: 'g', guardianPhone: '1' }, classes);
    expect(r.ok).toBe(false);
  });
  it('fails when the class cannot be resolved', () => {
    const r = validateImportRow({ firstName: 'A', lastName: 'B', className: 'Nope', guardianName: 'g', guardianPhone: '1' }, classes);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toMatch(/class/i);
  });
});
