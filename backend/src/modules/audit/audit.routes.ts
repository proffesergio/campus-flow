import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import * as controller from './audit.controller';

const router = Router();

/**
 * @openapi
 * /api/audit:
 *   get:
 *     tags: [Audit]
 *     summary: Paginated audit trail of create/update/delete actions (admin only)
 *     parameters:
 *       - $ref: '#/components/parameters/SchoolSlug'
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - in: query
 *         name: entity
 *         schema: { type: string }
 *       - in: query
 *         name: action
 *         schema: { type: string, enum: [CREATE, UPDATE, DELETE] }
 *     responses:
 *       200: { description: "Paginated audit log entries" }
 */
router.get('/', authenticate, requireRole('school_admin', 'super_admin'), controller.list);

export default router;
