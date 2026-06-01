import { prisma } from '../../config/prisma';
import { AppError } from '../../middleware/errorHandler';
import type { UpdateSchoolInput } from './schools.validator';

const SCHOOL_SELECT = {
  id: true,
  slug: true,
  name: true,
  primaryColor: true,
  secondaryColor: true,
  logoUrl: true,
  plan: true,
  timezone: true,
  locale: true,
  address: true,
  phone: true,
  email: true,
  website: true,
} as const;

export async function getMySchool(schoolId: string) {
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: SCHOOL_SELECT,
  });
  if (!school) throw new AppError(404, 'School not found');
  return school;
}

export async function updateMySchool(schoolId: string, data: UpdateSchoolInput) {
  const existing = await prisma.school.findUnique({ where: { id: schoolId } });
  if (!existing) throw new AppError(404, 'School not found');

  return prisma.school.update({
    where: { id: schoolId },
    data,
    select: SCHOOL_SELECT,
  });
}
