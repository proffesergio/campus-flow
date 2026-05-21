import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { env } from '../config/env';

interface JwtPayload {
  userId: string;
  schoolId: string;
  role: Role;
  email: string;
  firstName: string;
  lastName: string;
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const token =
    req.cookies?.access_token ??
    (req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice(7)
      : undefined);

  if (!token) {
    res.status(401).json({ success: false, message: 'Authentication required' });
    return;
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    // Ensure the token belongs to this tenant
    if (req.tenant && payload.schoolId !== req.tenant.schoolId) {
      res.status(403).json({ success: false, message: 'Token does not match school' });
      return;
    }

    req.user = payload;
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ success: false, message: 'Insufficient permissions' });
      return;
    }

    next();
  };
}

export function requireSuperAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'super_admin') {
    res.status(403).json({ success: false, message: 'Super admin access required' });
    return;
  }
  next();
}
