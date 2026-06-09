import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import * as ctrl from './notifications.controller';

/**
 * @openapi
 * tags:
 *   - name: Notifications
 *     description: Broadcast messages, in-app inbox, and device registration
 */

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /notifications/broadcast:
 *   post:
 *     tags: [Notifications]
 *     summary: Send a broadcast message
 *     description: |
 *       Sends a message to a target group via one or more channels (email, SMS, in-app).
 *       Supports variable substitution with {{varName}} syntax.
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [targetGroup, subject, message, channels]
 *             properties:
 *               targetGroup:
 *                 type: string
 *                 enum: [all_parents, all_teachers, all_students, specific_class, specific_role]
 *               classId:
 *                 type: string
 *                 description: Required when targetGroup=specific_class
 *               role:
 *                 type: string
 *                 enum: [teacher, parent, student, finance]
 *                 description: Required when targetGroup=specific_role
 *               subject:
 *                 type: string
 *               message:
 *                 type: string
 *                 description: Supports {{recipientName}}, {{schoolName}}, {{studentName}}, etc.
 *               channels:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [email, sms, in_app]
 *               variables:
 *                 type: object
 *                 additionalProperties:
 *                   type: string
 *     responses:
 *       200:
 *         description: Broadcast result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     sent: { type: integer }
 *                     failed: { type: integer }
 */
router.post('/broadcast', requireRole('school_admin', 'teacher'), ctrl.broadcast);
router.post('/notify-students', requireRole('school_admin', 'teacher'), ctrl.notifyStudents);

/**
 * @openapi
 * /notifications/logs:
 *   get:
 *     tags: [Notifications]
 *     summary: Get notification send history
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: channel
 *         schema: { type: string, enum: [email, sms, in_app] }
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [fee_reminder, attendance_alert, broadcast, welcome, system] }
 *     responses:
 *       200:
 *         description: Paginated log list
 */
router.get('/logs', requireRole('school_admin'), ctrl.getLogs);

/**
 * @openapi
 * /notifications/inbox:
 *   get:
 *     tags: [Notifications]
 *     summary: Get current user's in-app notification inbox
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Inbox with unread count
 */
router.get('/inbox', ctrl.getInbox);

/**
 * @openapi
 * /notifications/read-all:
 *   put:
 *     tags: [Notifications]
 *     summary: Mark all notifications as read
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: All marked read
 */
router.put('/read-all', ctrl.markAllRead);

/**
 * @openapi
 * /notifications/{id}/read:
 *   put:
 *     tags: [Notifications]
 *     summary: Mark a single notification as read
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Marked as read
 */
router.put('/:id/read', ctrl.markRead);

/**
 * @openapi
 * /devices/register:
 *   post:
 *     tags: [Notifications]
 *     summary: Register a push notification device token
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [pushToken, platform]
 *             properties:
 *               pushToken: { type: string }
 *               platform: { type: string, enum: [ios, android, web] }
 *     responses:
 *       200:
 *         description: Device registered
 */

export default router;
