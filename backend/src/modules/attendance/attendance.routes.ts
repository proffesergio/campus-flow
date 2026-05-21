import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import * as controller from './attendance.controller';

const router = Router();

router.use(authenticate);

// Today's status for teacher dashboard
router.get('/today-status', controller.todayStatus);

// Class attendance for a specific date
router.get('/', controller.getForClass);

// Monthly summary per student
router.get('/summary', controller.getMonthlySummary);

// Student self-service: own attendance history
router.get('/my-history', requireRole('student'), controller.getMyHistory);

// Individual student history
router.get('/student/:studentId', controller.getStudentHistory);

// Mark attendance — teacher or above
router.post('/mark', requireRole('teacher', 'school_admin', 'super_admin'), controller.mark);

export default router;
