import { prisma } from '../../config/prisma';
import { AppError } from '../../middleware/errorHandler';
import type { CreateMaterialInput, UpdateMaterialInput, MaterialQuery } from './practice-materials.validator';

const INCLUDE = {
  subject: { select: { id: true, name: true } },
  uploadedBy: { select: { firstName: true, lastName: true } },
  class: { select: { id: true, name: true, section: true } },
} as const;

export async function listMaterials(schoolId: string, query: MaterialQuery, studentClassId?: string) {
  const { search, classId, subjectId, type, publishedOnly, page, limit } = query;
  const skip = (page - 1) * limit;

  const where = {
    schoolId,
    ...(publishedOnly && { isPublished: true }),
    // Students only see materials for their class or all-class materials
    ...(studentClassId && { OR: [{ classId: studentClassId }, { classId: null }] }),
    ...(classId && !studentClassId && { classId }),
    ...(subjectId && { subjectId }),
    ...(type && { type }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
  };

  const [items, total] = await Promise.all([
    prisma.practiceMaterial.findMany({
      where,
      include: INCLUDE,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.practiceMaterial.count({ where }),
  ]);

  return { data: items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
}

export async function createMaterial(schoolId: string, uploadedById: string, data: CreateMaterialInput) {
  return prisma.practiceMaterial.create({
    data: {
      schoolId,
      uploadedById,
      title: data.title,
      description: data.description,
      type: data.type,
      fileUrl: data.fileUrl || null,
      externalUrl: data.externalUrl || null,
      classId: data.classId ?? null,
      subjectId: data.subjectId ?? null,
      isPublished: data.isPublished,
    },
    include: INCLUDE,
  });
}

export async function updateMaterial(id: string, schoolId: string, data: UpdateMaterialInput) {
  const existing = await prisma.practiceMaterial.findFirst({ where: { id, schoolId } });
  if (!existing) throw new AppError(404, 'Material not found');

  return prisma.practiceMaterial.update({
    where: { id },
    data: {
      ...data,
      fileUrl: data.fileUrl ?? existing.fileUrl,
      externalUrl: data.externalUrl ?? existing.externalUrl,
    },
    include: INCLUDE,
  });
}

export async function deleteMaterial(id: string, schoolId: string) {
  const existing = await prisma.practiceMaterial.findFirst({ where: { id, schoolId } });
  if (!existing) throw new AppError(404, 'Material not found');
  await prisma.practiceMaterial.delete({ where: { id } });
}
