import { Request, Response, NextFunction } from 'express';
import * as studentsService from './students.service';
import { createStudentSchema, updateStudentSchema, studentQuerySchema, bulkStudentSchema, importStudentsSchema } from './students.validator';
import type { RawStudentRow } from './students.import';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const query = studentQuerySchema.parse(req.query);
    const result = await studentsService.listStudents(req.tenant.schoolId, query);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
}

export async function getOne(req: Request, res: Response, next: NextFunction) {
  try {
    const student = await studentsService.getStudent(req.params.id, req.tenant.schoolId);
    res.json({ success: true, data: student });
  } catch (err) { next(err); }
}

export async function getProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const student = await studentsService.getStudentProfile(req.params.id, req.tenant.schoolId);
    res.json({ success: true, data: student });
  } catch (err) { next(err); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createStudentSchema.parse(req.body);
    const student = await studentsService.createStudent(req.tenant.schoolId, data);
    res.status(201).json({ success: true, data: student });
  } catch (err) { next(err); }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const data = updateStudentSchema.parse(req.body);
    const student = await studentsService.updateStudent(req.params.id, req.tenant.schoolId, data);
    res.json({ success: true, data: student });
  } catch (err) { next(err); }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await studentsService.deleteStudent(req.params.id, req.tenant.schoolId);
    res.json({ success: true, message: 'Student deactivated' });
  } catch (err) { next(err); }
}

export async function stats(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await studentsService.getStats(req.tenant.schoolId);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function myRecord(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await studentsService.getMyRecord(req.user.userId, req.tenant.schoolId);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function myDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await studentsService.getMyDashboard(req.user.userId, req.tenant.schoolId);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function myRanking(req: Request, res: Response, next: NextFunction) {
  try {
    const examId = req.query.examId as string | undefined;
    const data = await studentsService.getMyRanking(req.user.userId, req.tenant.schoolId, examId);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function bulk(req: Request, res: Response, next: NextFunction) {
  try {
    const { action, ids, classId } = bulkStudentSchema.parse(req.body);
    const data = await studentsService.bulkStudents(req.tenant.schoolId, action, ids, classId);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function importCsv(req: Request, res: Response, next: NextFunction) {
  try {
    const { rows } = importStudentsSchema.parse(req.body);
    const data = await studentsService.importStudents(req.tenant.schoolId, rows as RawStudentRow[]);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}
