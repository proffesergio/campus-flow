import { Request, Response, NextFunction } from 'express';
import * as parentsService from './parents.service';
import { getStudentGrades } from '../exams/exams.service';
import { getStudentHistory } from '../attendance/attendance.service';
import { listInvoices } from '../finance/finance.service';
import * as notificationsService from '../notifications/notifications.service';
import { attendanceQuerySchema } from '../attendance/attendance.validator';

export async function myChildren(req: Request, res: Response, next: NextFunction) {
  try {
    const children = await parentsService.getChildren(req.user!.userId, req.tenant.schoolId);
    res.json({ success: true, data: children });
  } catch (err) { next(err); }
}

export async function childDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await parentsService.getChildDashboard(
      req.user!.userId,
      req.params.studentId!,
      req.tenant.schoolId,
    );
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function childGrades(req: Request, res: Response, next: NextFunction) {
  try {
    await parentsService.resolveOwnedChild(req.user!.userId, req.params.studentId!, req.tenant.schoolId);
    const term = req.query.term ? String(req.query.term) : undefined;
    const data = await getStudentGrades(req.tenant.schoolId, req.params.studentId!, term);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function childAttendance(req: Request, res: Response, next: NextFunction) {
  try {
    await parentsService.resolveOwnedChild(req.user!.userId, req.params.studentId!, req.tenant.schoolId);
    const query = attendanceQuerySchema.parse(req.query);
    const data = await getStudentHistory(req.tenant.schoolId, req.params.studentId!, query);
    res.json({ success: true, ...data });
  } catch (err) { next(err); }
}

export async function childInvoices(req: Request, res: Response, next: NextFunction) {
  try {
    await parentsService.resolveOwnedChild(req.user!.userId, req.params.studentId!, req.tenant.schoolId);
    const data = await listInvoices(req.tenant.schoolId, {
      studentId: req.params.studentId!,
      page: 1,
      limit: 50,
    });
    res.json({ success: true, ...data });
  } catch (err) { next(err); }
}

export async function myNotices(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await notificationsService.getInbox(req.user!.userId, req.tenant.schoolId);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}
