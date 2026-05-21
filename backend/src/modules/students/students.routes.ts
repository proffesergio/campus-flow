import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import * as controller from './students.controller';

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /api/students/stats:
 *   get:
 *     tags: [Students]
 *     summary: Aggregate student counts
 *     parameters:
 *       - $ref: '#/components/parameters/SchoolSlug'
 *     responses:
 *       200:
 *         description: "{ total, active, thisMonth }"
 */
router.get('/stats', controller.stats);

// Student self-service — must come before /:id to avoid param capture
router.get('/me', requireRole('student'), controller.myRecord);
router.get('/me/dashboard', requireRole('student'), controller.myDashboard);
router.get('/me/ranking', requireRole('student'), controller.myRanking);

/**
 * @openapi
 * /api/students:
 *   get:
 *     tags: [Students]
 *     summary: Paginated student list with search & filters
 *     parameters:
 *       - $ref: '#/components/parameters/SchoolSlug'
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search by name, roll, or guardian phone
 *       - in: query
 *         name: classId
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [active, inactive, graduated, transferred] }
 *     responses:
 *       200:
 *         description: Paginated students
 *   post:
 *     tags: [Students]
 *     summary: Create a student
 *     parameters:
 *       - $ref: '#/components/parameters/SchoolSlug'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StudentInput'
 *     responses:
 *       201:
 *         description: Student created
 */
router.get('/', controller.list);
router.post('/', requireRole('school_admin', 'teacher', 'super_admin'), controller.create);

/**
 * @openapi
 * /api/students/{id}:
 *   get:
 *     tags: [Students]
 *     summary: Get student by ID
 *     parameters:
 *       - $ref: '#/components/parameters/SchoolSlug'
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Student record
 *   put:
 *     tags: [Students]
 *     summary: Update a student
 *     parameters:
 *       - $ref: '#/components/parameters/SchoolSlug'
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StudentInput'
 *     responses:
 *       200:
 *         description: Updated
 *   delete:
 *     tags: [Students]
 *     summary: Soft-delete student (status → inactive)
 *     parameters:
 *       - $ref: '#/components/parameters/SchoolSlug'
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Deactivated
 */
router.get('/:id', controller.getOne);
router.get('/:id/profile', controller.getProfile);
router.put('/:id', requireRole('school_admin', 'teacher', 'super_admin'), controller.update);
router.delete('/:id', requireRole('school_admin', 'super_admin'), controller.remove);

export default router;
