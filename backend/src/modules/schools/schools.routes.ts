import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import * as controller from './schools.controller';

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /api/schools/me:
 *   get:
 *     tags: [Schools]
 *     summary: Get the current school's profile and branding settings
 *     parameters:
 *       - $ref: '#/components/parameters/SchoolSlug'
 *     responses:
 *       200:
 *         description: "School branding & profile (colors, logo, contact info)"
 *   put:
 *     tags: [Schools]
 *     summary: Update the current school's appearance and profile settings
 *     description: Admin-only. Accepts partial updates of name, colors (hex), logo (data/http URL), and contact fields.
 *     parameters:
 *       - $ref: '#/components/parameters/SchoolSlug'
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               primaryColor: { type: string, example: '#3B82F6' }
 *               secondaryColor: { type: string, example: '#8B5CF6' }
 *               logoUrl: { type: string, nullable: true }
 *               address: { type: string }
 *               phone: { type: string }
 *               email: { type: string }
 *               website: { type: string }
 *               timezone: { type: string }
 *               locale: { type: string, enum: [en, bn] }
 *     responses:
 *       200:
 *         description: Updated school settings
 *       400:
 *         description: Validation error
 *       403:
 *         description: Insufficient permissions
 */
router.get('/me', controller.me);
router.put('/me', requireRole('school_admin', 'super_admin'), controller.update);

export default router;
