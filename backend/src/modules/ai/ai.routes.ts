import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import * as ctrl from './ai.controller';

const router = Router();

router.use(authenticate);

// Claude SSE — teacher / school_admin only
router.post('/report-narrative',  requireRole('school_admin', 'teacher'), ctrl.reportNarrative);
router.post('/attendance-summary', requireRole('school_admin', 'teacher'), ctrl.attendanceSummary);
router.post('/class-insights',    requireRole('school_admin', 'teacher'), ctrl.classInsights);

// OpenAI JSON — school_admin / finance
router.post('/admin-query', requireRole('school_admin', 'finance'), ctrl.adminQuery);

// OpenAI JSON — teacher / student (practice test generation)
router.post('/generate-practice-questions', requireRole('school_admin', 'teacher', 'student'), ctrl.generatePracticeQuestions);

// OpenAI SSE — student study assistant chat
router.post('/study-chat', requireRole('student'), ctrl.studyChat);

export default router;
