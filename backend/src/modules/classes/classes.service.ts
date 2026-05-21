import { prisma } from '../../config/prisma';
import { AppError } from '../../middleware/errorHandler';
import type { CreateClassInput, UpdateClassInput } from './classes.validator';

export async function listClasses(schoolId: string) {
  return prisma.class.findMany({
    where: { schoolId },
    include: {
      teacher: { select: { id: true, firstName: true, lastName: true } },
      _count: { select: { students: { where: { status: 'active' } } } },
    },
    orderBy: [{ academicYear: 'desc' }, { name: 'asc' }],
  });
}

export async function createClass(schoolId: string, data: CreateClassInput) {
  return prisma.class.create({
    data: { ...data, schoolId },
    include: { teacher: { select: { id: true, firstName: true, lastName: true } } },
  });
}

export async function updateClass(id: string, schoolId: string, data: UpdateClassInput) {
  const existing = await prisma.class.findFirst({ where: { id, schoolId } });
  if (!existing) throw new AppError(404, 'Class not found');
  return prisma.class.update({ where: { id }, data });
}

export async function deleteClass(id: string, schoolId: string) {
  const existing = await prisma.class.findFirst({ where: { id, schoolId } });
  if (!existing) throw new AppError(404, 'Class not found');
  const studentCount = await prisma.student.count({ where: { classId: id, status: 'active' } });
  if (studentCount > 0) throw new AppError(409, 'Cannot delete a class with active students');
  return prisma.class.delete({ where: { id } });
}
