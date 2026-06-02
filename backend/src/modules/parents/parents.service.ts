import { prisma } from '../../config/prisma';
import { AppError } from '../../middleware/errorHandler';
import { dashboardForStudent } from '../students/students.service';

/**
 * All children linked to a parent account within a school.
 */
export async function getChildren(parentUserId: string, schoolId: string) {
  return prisma.student.findMany({
    where: { parentId: parentUserId, schoolId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      rollNumber: true,
      photoUrl: true,
      status: true,
      class: { select: { id: true, name: true, section: true, academicYear: true } },
    },
    orderBy: [{ class: { name: 'asc' } }, { firstName: 'asc' }],
  });
}

/**
 * Resolve a child and assert it belongs to this parent + school.
 * Throws 404 (not 403) so we never leak which student IDs exist.
 */
export async function resolveOwnedChild(
  parentUserId: string,
  studentId: string,
  schoolId: string,
) {
  const student = await prisma.student.findFirst({
    where: { id: studentId, schoolId, parentId: parentUserId },
    include: {
      class: { select: { id: true, name: true, section: true, academicYear: true } },
    },
  });
  if (!student) throw new AppError(404, 'Child not found for this account');
  return student;
}

export async function getChildDashboard(
  parentUserId: string,
  studentId: string,
  schoolId: string,
) {
  const student = await resolveOwnedChild(parentUserId, studentId, schoolId);
  const dashboard = await dashboardForStudent(student, schoolId);
  return { ...dashboard, student };
}
