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

/**
 * @openapi
 * /api/analytics/dashboard-summary:
 *   get:
 *     tags: [Analytics]
 *     summary: Onboarding counts, grade distribution, and 6-month attendance trend
 *     parameters:
 *       - $ref: '#/components/parameters/SchoolSlug'
 *     responses:
 *       200: { description: "{ onboarding, gradeDistribution, attendanceTrend }" }
 */
router.get(
  '/dashboard-summary',
  authenticate,
  requireRole('school_admin', 'super_admin'),
  controller.dashboardSummary,
);

export default router;
