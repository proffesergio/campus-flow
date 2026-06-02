import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import * as controller from './analytics.controller';

const router = Router();

/**
 * @openapi
 * /api/analytics/at-risk:
 *   get:
 *     tags: [Analytics]
 *     summary: Rule-based list of at-risk students (low attendance / failing grades)
 *     parameters:
 *       - $ref: '#/components/parameters/SchoolSlug'
 *     responses:
 *       200: { description: "{ items, summary, thresholds }" }
 */
router.get(
  '/at-risk',
  authenticate,
  requireRole('school_admin', 'teacher', 'super_admin'),
  controller.atRisk,
);

export default router;
