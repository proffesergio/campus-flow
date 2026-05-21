import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import * as controller from './exams.controller';

const router = Router();

router.use(authenticate);

// ── Subjects ──────────────────────────────────────────────────────────────────
router.get('/subjects', controller.getSubjects);
router.post(
  '/subjects',
  requireRole('teacher', 'school_admin', 'super_admin'),
  controller.addSubject,
);
router.put(
  '/subjects/:id',
  requireRole('teacher', 'school_admin', 'super_admin'),
  controller.editSubject,
);
router.delete(
  '/subjects/:id',
  requireRole('school_admin', 'super_admin'),
  controller.removeSubject,
);

// ── Grades ── (before :id routes to avoid param collision) ───────────────────
router.post(
  '/grades/bulk',
  requireRole('teacher', 'school_admin', 'super_admin'),
  controller.saveGrades,
);
// Student self-service: GET /exams/grades/my-grades  (must come before /grades/student/:studentId)
router.get('/grades/my-grades', requireRole('student'), controller.getMyGrades);
router.get('/grades/student/:studentId', controller.getGradesForStudent);
router.get(
  '/grades/report-card/:studentId',
  controller.getReportCard,
);
router.get(
  '/grades/report-card/:studentId/pdf',
  controller.downloadReportCardPdf,
);

// Student self-service: GET /exams/my  (must come before /:id)
router.get('/my', requireRole('student'), controller.getMyExams);

// ── Exams ─────────────────────────────────────────────────────────────────────
router.get('/', controller.getExams);
router.post(
  '/',
  requireRole('teacher', 'school_admin', 'super_admin'),
  controller.addExam,
);
router.get('/:id', controller.getExamById);
router.put(
  '/:id',
  requireRole('teacher', 'school_admin', 'super_admin'),
  controller.editExam,
);
router.delete(
  '/:id',
  requireRole('school_admin', 'super_admin'),
  controller.removeExam,
);
router.post(
  '/:id/publish',
  requireRole('teacher', 'school_admin', 'super_admin'),
  controller.togglePublish,
);
router.get('/:id/grades', controller.getGradesForExam);

export default router;
