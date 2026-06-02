import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import * as controller from './parents.controller';

const router = Router();

router.use(authenticate, requireRole('parent'));

/**
 * @openapi
 * /api/parents/me/children:
 *   get:
 *     tags: [Parents]
 *     summary: List the children linked to the logged-in parent
 *     parameters:
 *       - $ref: '#/components/parameters/SchoolSlug'
 *     responses:
 *       200: { description: "Array of children with class info" }
 */
router.get('/me/children', controller.myChildren);

/**
 * @openapi
 * /api/parents/me/notices:
 *   get:
 *     tags: [Parents]
 *     summary: In-app notices/announcements for the parent
 *     parameters:
 *       - $ref: '#/components/parameters/SchoolSlug'
 *     responses:
 *       200: { description: "{ items, unread }" }
 */
router.get('/me/notices', controller.myNotices);

/**
 * @openapi
 * /api/parents/me/children/{studentId}/dashboard:
 *   get:
 *     tags: [Parents]
 *     summary: Overview (attendance %, fees, grades, rank) for one child
 *     parameters:
 *       - $ref: '#/components/parameters/SchoolSlug'
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: "Child dashboard" }
 *       404: { description: "Child not linked to this account" }
 */
router.get('/me/children/:studentId/dashboard', controller.childDashboard);
router.get('/me/children/:studentId/grades', controller.childGrades);
router.get('/me/children/:studentId/attendance', controller.childAttendance);
router.get('/me/children/:studentId/invoices', controller.childInvoices);

export default router;
