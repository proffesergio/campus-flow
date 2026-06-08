import { Request, Response, NextFunction } from 'express';
import * as analyticsService from './analytics.service';

export async function atRisk(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await analyticsService.getAtRiskStudents(req.tenant.schoolId);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
}

export async function dashboardSummary(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await analyticsService.getDashboardSummary(req.tenant.schoolId);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}
