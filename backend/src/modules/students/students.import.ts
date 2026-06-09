export interface ClassLite { id: string; name: string; section: string | null }

export interface RawStudentRow {
  firstName?: string;
  lastName?: string;
  className?: string;
  section?: string;
  rollNumber?: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianEmail?: string;
  gender?: string;
  dateOfBirth?: string;
}

export interface ImportCreateInput {
  classId: string;
  firstName: string;
  lastName: string;
  guardianName: string;
  guardianPhone: string;
  rollNumber?: string;
  guardianEmail?: string;
  gender?: 'male' | 'female' | 'other';
  dateOfBirth?: string;
}

export type RowResult =
  | { ok: true; value: ImportCreateInput }
  | { ok: false; message: string };

/** Resolve a class id from a human-entered name + section (both case-insensitive). */
export function resolveClassId(classes: ClassLite[], name?: string, section?: string): string | null {
  if (!name) return null;
  const n = name.trim().toLowerCase();
  const s = (section ?? '').trim().toLowerCase();
  const match = classes.find(
    (c) => c.name.trim().toLowerCase() === n && (c.section ?? '').trim().toLowerCase() === s,
  );
  return match ? match.id : null;
}

/** Validate + normalize one raw CSV row into a student create input. */
export function validateImportRow(row: RawStudentRow, classes: ClassLite[]): RowResult {
  const firstName = row.firstName?.trim();
  const lastName = row.lastName?.trim();
  const guardianName = row.guardianName?.trim();
  const guardianPhone = row.guardianPhone?.trim();
  if (!firstName || !lastName || !guardianName || !guardianPhone) {
    return { ok: false, message: 'Missing required field (firstName, lastName, guardianName, guardianPhone)' };
  }
  const classId = resolveClassId(classes, row.className, row.section);
  if (!classId) {
    return { ok: false, message: `Class not found: "${row.className ?? ''}${row.section ? ' ' + row.section : ''}"` };
  }
  const gender = row.gender?.trim().toLowerCase();
  const value: ImportCreateInput = {
    classId, firstName, lastName, guardianName, guardianPhone,
    ...(row.rollNumber?.trim() ? { rollNumber: row.rollNumber.trim() } : {}),
    ...(row.guardianEmail?.trim() ? { guardianEmail: row.guardianEmail.trim() } : {}),
    ...(gender === 'male' || gender === 'female' || gender === 'other' ? { gender } : {}),
    ...(row.dateOfBirth?.trim() ? { dateOfBirth: row.dateOfBirth.trim() } : {}),
  };
  return { ok: true, value };
}
