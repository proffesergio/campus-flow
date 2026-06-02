import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';

const ACTION: Record<string, string> = {
  POST: 'CREATE',
  PUT: 'UPDATE',
  PATCH: 'UPDATE',
  DELETE: 'DELETE',
};

// Never persist these to the audit trail.
const SENSITIVE = new Set([
  'password', 'adminPassword', 'newPassword', 'passwordHash', 'token', 'logoUrl',
]);

function sanitize(body: unknown): Record<string, unknown> | undefined {
  if (!body || typeof body !== 'object') return undefined;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body as Record<string, unknown>)) {
    if (SENSITIVE.has(k)) continue;
    // keep it light: record the field names + scalar values, truncate long strings
    out[k] = typeof v === 'string' && v.length > 120 ? `${v.slice(0, 120)}…` : v;
  }
  return Object.keys(out).length ? out : undefined;
}

function looksLikeId(seg: string | undefined): boolean {
  return !!seg && /^c[^\s/]{8,}$/.test(seg);
}

/**
 * Writes an AuditLog row for every successful mutating request (POST/PUT/PATCH/DELETE).
 * Mounted under /api after tenant resolution; reads req.user/req.tenant which are
 * populated by the time the response finishes. Logging is fire-and-forget so it
 * never blocks or fails the request.
 */
export function auditMiddleware(req: Request, res: Response, next: NextFunction): void {
  const action = ACTION[req.method];
  if (!action) return next();

  // Capture now — downstream routers mutate req.url/req.path during dispatch,
  // so we read the stable originalUrl and snapshot the body up front.
  const bodySnapshot = sanitize(req.body);
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip;
  const fullPath = req.originalUrl.split('?')[0] ?? '';
  const segments = fullPath.replace(/^\/api\/?/, '').split('/').filter(Boolean);
  const entity = segments[0] ?? 'unknown';
  const entityId = looksLikeId(segments[1]) ? segments[1]! : null;

  res.on('finish', () => {
    if (res.statusCode >= 400) return; // only successful mutations

    const schoolId = req.tenant?.schoolId ?? req.user?.schoolId;
    if (!schoolId) return;

    prisma.auditLog
      .create({
        data: {
          schoolId,
          userId: req.user?.userId ?? null,
          actorEmail: req.user?.email ?? null,
          actorRole: req.user?.role ?? null,
          action,
          entity,
          entityId,
          method: req.method,
          path: req.originalUrl.split('?')[0]!,
          statusCode: res.statusCode,
          ip: ip ?? null,
          metadata: action === 'DELETE' ? undefined : (bodySnapshot as Prisma.InputJsonValue | undefined),
        },
      })
      .catch((err) => console.error('[audit] failed to write log:', err));
  });

  next();
}
