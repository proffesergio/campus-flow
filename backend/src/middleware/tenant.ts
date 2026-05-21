import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { env } from '../config/env';

export async function tenantMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const host = req.headers.host ?? '';

  // Skip tenant resolution for paths that don't require an existing school
  const TENANT_FREE_PATHS = [
    '/health',
    '/auth/register-school',
    '/auth/login',
    '/auth/refresh',
    '/auth/logout',
  ];
  if (TENANT_FREE_PATHS.some((p) => req.path.startsWith(p))) {
    return next();
  }

  let slug: string | null = null;

  // Extract slug from subdomain: dhaka-grammar.campusflow.app → dhaka-grammar
  if (host.endsWith(`.${env.APP_DOMAIN}`)) {
    slug = host.replace(`.${env.APP_DOMAIN}`, '');
  } else if (env.NODE_ENV === 'development') {
    // In dev, allow X-School-Slug header for testing without subdomain
    slug = (req.headers['x-school-slug'] as string) ?? null;
  }

  if (!slug) {
    res.status(400).json({ success: false, message: 'School not identified' });
    return;
  }

  const school = await prisma.school.findUnique({
    where: { slug, isActive: true },
  });

  if (!school) {
    res.status(404).json({ success: false, message: 'School not found' });
    return;
  }

  req.tenant = { schoolId: school.id, slug: school.slug, school };
  next();
}
