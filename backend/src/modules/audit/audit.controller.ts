import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as auditService from './audit.service';

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
  entity: z.string().optional(),
  action: z.enum(['CREATE', 'UPDATE', 'DELETE']).optional(),
});

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const q = querySchema.parse(req.query);
    const result = await auditService.listAuditLogs(req.tenant.schoolId, q);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
}
