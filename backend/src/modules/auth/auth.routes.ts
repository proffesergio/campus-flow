import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import * as controller from './auth.controller';

const router = Router();

/**
 * @openapi
 * /api/auth/register-school:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new school (one-time onboarding)
 *     description: Creates the school record and the first school_admin user. Do NOT include X-School-Slug header here.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterSchoolInput'
 *     responses:
 *       201:
 *         description: School and admin account created
 *       409:
 *         description: Slug or email already in use
 */
router.post('/register-school', controller.registerSchool);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login to a school account
 *     description: Sets httpOnly access_token + refresh_token cookies. Include X-School-Slug header.
 *     security: []
 *     parameters:
 *       - $ref: '#/components/parameters/SchoolSlug'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginInput'
 *     responses:
 *       200:
 *         description: Login successful — cookies set
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id: { type: string }
 *                         email: { type: string }
 *                         role: { type: string }
 *                         firstName: { type: string }
 *                         lastName: { type: string }
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', controller.login);

/**
 * @openapi
 * /api/auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh access token
 *     description: Uses the httpOnly refresh_token cookie to issue a new access_token cookie.
 *     security: []
 *     parameters:
 *       - $ref: '#/components/parameters/SchoolSlug'
 *     responses:
 *       200:
 *         description: New access_token cookie set
 *       401:
 *         description: Refresh token invalid or expired
 */
router.post('/refresh', controller.refresh);

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout — clears session cookies
 *     parameters:
 *       - $ref: '#/components/parameters/SchoolSlug'
 *     responses:
 *       200:
 *         description: Logged out
 */
router.post('/logout', controller.logout);

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current user and school config
 *     parameters:
 *       - $ref: '#/components/parameters/SchoolSlug'
 *     responses:
 *       200:
 *         description: Current user and school info
 *       401:
 *         description: Not authenticated
 */
router.get('/me', authenticate, controller.me);

/**
 * @openapi
 * /api/auth/me:
 *   put:
 *     tags: [Auth]
 *     summary: Update the current user's own profile
 *     responses:
 *       200:
 *         description: Updated profile
 */
router.put('/me', authenticate, controller.updateMe);

/**
 * @openapi
 * /api/auth/change-password:
 *   post:
 *     tags: [Auth]
 *     summary: Change the current user's password
 *     responses:
 *       200:
 *         description: Password changed
 *       400:
 *         description: Current password incorrect
 */
router.post('/change-password', authenticate, controller.changePassword);

export default router;
