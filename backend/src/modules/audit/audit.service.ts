import { prisma } from '../../config/prisma';

export interface AuditQuery {
  page: number;
  limit: number;
  entity?: string;
  action?: string;
}

export async function listAuditLogs(schoolId: string, q: AuditQuery) {
  const skip = (q.page - 1) * q.limit;
  const where = {
    schoolId,
    ...(q.entity ? { entity: q.entity } : {}),
    ...(q.action ? { action: q.action } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: q.limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { items, meta: { total, page: q.page, limit: q.limit, totalPages: Math.ceil(total / q.limit) } };
}
