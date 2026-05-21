import { Request, Response, NextFunction } from 'express';
import * as service from './exams.service';
import {
  createSubjectSchema,
  updateSubjectSchema,
  createExamSchema,
  updateExamSchema,
  bulkGradeSchema,
  examListQuerySchema,
} from './exams.validator';

// ── Subjects ──────────────────────────────────────────────────────────────────

export async function getSubjects(req: Request, res: Response, next: NextFunction) {
  try {
    const { classId } = req.query as { classId?: string };
    const data = await service.listSubjects(req.tenant.schoolId, classId);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function addSubject(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createSubjectSchema.parse(req.body);
    const subject = await service.createSubject(req.tenant.schoolId, data);
    res.status(201).json({ success: true, data: subject });
  } catch (err) { next(err); }
}

export async function editSubject(req: Request, res: Response, next: NextFunction) {
  try {
    const data = updateSubjectSchema.parse(req.body);
    const subject = await service.updateSubject(req.tenant.schoolId, req.params.id, data);
    res.json({ success: true, data: subject });
  } catch (err) { next(err); }
}

export async function removeSubject(req: Request, res: Response, next: NextFunction) {
  try {
    await service.deleteSubject(req.tenant.schoolId, req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
}

// ── Exams ─────────────────────────────────────────────────────────────────────

export async function getExams(req: Request, res: Response, next: NextFunction) {
  try {
    const query = examListQuerySchema.parse(req.query);
    const result = await service.listExams(req.tenant.schoolId, query);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
}

export async function addExam(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createExamSchema.parse(req.body);
    const exam = await service.createExam(req.tenant.schoolId, req.user.userId, data);
    res.status(201).json({ success: true, data: exam });
  } catch (err) { next(err); }
}

export async function getExamById(req: Request, res: Response, next: NextFunction) {
  try {
    const exam = await service.getExam(req.tenant.schoolId, req.params.id);
    res.json({ success: true, data: exam });
  } catch (err) { next(err); }
}

export async function editExam(req: Request, res: Response, next: NextFunction) {
  try {
    const data = updateExamSchema.parse(req.body);
    const exam = await service.updateExam(req.tenant.schoolId, req.params.id, data);
    res.json({ success: true, data: exam });
  } catch (err) { next(err); }
}

export async function removeExam(req: Request, res: Response, next: NextFunction) {
  try {
    await service.deleteExam(req.tenant.schoolId, req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
}

export async function togglePublish(req: Request, res: Response, next: NextFunction) {
  try {
    const exam = await service.publishExam(req.tenant.schoolId, req.params.id);
    res.json({ success: true, data: exam });
  } catch (err) { next(err); }
}

// ── Grades ────────────────────────────────────────────────────────────────────

export async function saveGrades(req: Request, res: Response, next: NextFunction) {
  try {
    const data = bulkGradeSchema.parse(req.body);
    const result = await service.bulkSaveGrades(req.tenant.schoolId, req.user.userId, data);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function getGradesForExam(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await service.getExamGrades(req.tenant.schoolId, req.params.id);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function getGradesForStudent(req: Request, res: Response, next: NextFunction) {
  try {
    const { term } = req.query as { term?: string };
    const result = await service.getStudentGrades(
      req.tenant.schoolId,
      req.params.studentId,
      term,
    );
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function getMyGrades(req: Request, res: Response, next: NextFunction) {
  try {
    const { term } = req.query as { term?: string };
    const student = await import('../../config/prisma').then(({ prisma }) =>
      prisma.student.findFirst({ where: { userId: req.user.userId, schoolId: req.tenant.schoolId } }),
    );
    if (!student) {
      res.status(404).json({ success: false, message: 'No student record linked' });
      return;
    }
    const result = await service.getStudentGrades(req.tenant.schoolId, student.id, term);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function getMyExams(req: Request, res: Response, next: NextFunction) {
  try {
    const { upcoming, past } = req.query as { upcoming?: string; past?: string };
    const { prisma } = await import('../../config/prisma');
    const student = await prisma.student.findFirst({
      where: { userId: req.user.userId, schoolId: req.tenant.schoolId },
    });
    if (!student) {
      res.status(404).json({ success: false, message: 'No student record linked' });
      return;
    }
    const now = new Date();
    const exams = await prisma.exam.findMany({
      where: {
        schoolId: req.tenant.schoolId,
        classId: student.classId,
        isPublished: true,
        ...(upcoming === 'true' ? { examDate: { gte: now } } : {}),
        ...(past === 'true' ? { examDate: { lt: now } } : {}),
      },
      include: { subject: { select: { name: true } } },
      orderBy: { examDate: upcoming === 'true' ? 'asc' : 'desc' },
      take: 50,
    });
    res.json({ success: true, data: exams });
  } catch (err) { next(err); }
}

export async function getReportCard(req: Request, res: Response, next: NextFunction) {
  try {
    const { term } = req.query as { term?: string };
    if (!term) {
      res.status(400).json({ success: false, message: 'term query param is required' });
      return;
    }
    const result = await service.getReportCardData(
      req.tenant.schoolId,
      req.params.studentId,
      term,
    );
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function downloadReportCardPdf(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { term } = req.query as { term?: string };
    if (!term) {
      res.status(400).json({ success: false, message: 'term query param is required' });
      return;
    }

    const { generateReportCardPdf } = await import('../../services/pdf.service');
    const school = req.tenant.school;
    const reportData = await service.getReportCardData(
      req.tenant.schoolId,
      req.params.studentId,
      term,
    );

    const buffer = await generateReportCardPdf(school, reportData);
    const filename = `report-card-${reportData.student.firstName}-${term}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err) { next(err); }
}
