import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import * as controller from './classes.controller';

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /api/classes:
 *   get:
 *     tags: [Classes]
 *     summary: List all classes with student count
 *     parameters:
 *       - $ref: '#/components/parameters/SchoolSlug'
 *     responses:
 *       200:
 *         description: Array of classes
 *   post:
 *     tags: [Classes]
 *     summary: Create a class
 *     parameters:
 *       - $ref: '#/components/parameters/SchoolSlug'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ClassInput'
 *     responses:
 *       201:
 *         description: Class created
 *       409:
 *         description: Duplicate name/section/year
 */
router.get('/', controller.list);
router.post('/', requireRole('school_admin', 'super_admin'), controller.create);

/**
 * @openapi
 * /api/classes/{id}:
 *   put:
 *     tags: [Classes]
 *     summary: Update a class
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
 *             $ref: '#/components/schemas/ClassInput'
 *     responses:
 *       200:
 *         description: Updated
 *   delete:
 *     tags: [Classes]
 *     summary: Delete a class (fails if students enrolled)
 *     parameters:
 *       - $ref: '#/components/parameters/SchoolSlug'
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Deleted
 *       409:
 *         description: Has enrolled students
 */
router.put('/:id', requireRole('school_admin', 'super_admin'), controller.update);
router.delete('/:id', requireRole('school_admin', 'super_admin'), controller.remove);

export default router;
