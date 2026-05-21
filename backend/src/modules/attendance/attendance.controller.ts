import { Request, Response, NextFunction } from 'express';
import * as attendanceService from './attendance.service';
import { markAttendanceSchema, attendanceQuerySchema } from './attendance.validator';

export async function mark(req: Request, res: Response, next: NextFunction) {
  try {
    const data = markAttendanceSchema.parse(req.body);
    const result = await attendanceService.markAttendance(
      req.tenant.schoolId,
      req.user.userId,
      data,
    );
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function getForClass(req: Request, res: Response, next: NextFunction) {
  try {
    const { classId, date } = req.query as { classId: string; date: string };
    if (!classId || !date) {
      res.status(400).json({ success: false, message: 'classId and date are required' });
      return;
    }
    const result = await attendanceService.getClassAttendance(req.tenant.schoolId, classId, date);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function getStudentHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const query = attendanceQuerySchema.parse(req.query);
    const result = await attendanceService.getStudentHistory(
      req.tenant.schoolId,
      req.params.studentId,
      query,
    );
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
}

export async function getMonthlySummary(req: Request, res: Response, next: NextFunction) {
  try {
    const { classId, month } = req.query as { classId: string; month: string };
    if (!classId || !month) {
      res.status(400).json({ success: false, message: 'classId and month (YYYY-MM) are required' });
      return;
    }
    const result = await attendanceService.getMonthSummary(req.tenant.schoolId, classId, month);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function todayStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await attendanceService.getTodayStatus(req.tenant.schoolId);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function getMyHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const { from, to } = req.query as { from?: string; to?: string };
    const { prisma } = await import('../../config/prisma');
    const student = await prisma.student.findFirst({
      where: { userId: req.user.userId, schoolId: req.tenant.schoolId },
    });
    if (!student) {
      res.status(404).json({ success: false, message: 'No student record linked' });
      return;
    }
    const records = await prisma.attendance.findMany({
      where: {
        schoolId: req.tenant.schoolId,
        studentId: student.id,
        ...(from || to ? {
          date: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to) } : {}),
          },
        } : {}),
      },
      orderBy: { date: 'desc' },
      select: { id: true, date: true, status: true, note: true },
    });
    res.json({ success: true, data: records });
  } catch (err) { next(err); }
}
