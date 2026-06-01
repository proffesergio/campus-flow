import { Request, Response, NextFunction } from 'express';
import { broadcastSchema } from './notifications.validator';
import * as svc from './notifications.service';
import { AppError } from '../../middleware/errorHandler';

export async function broadcast(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = broadcastSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(422, 'Validation failed', parsed.error.flatten().fieldErrors);
    }
    const result = await svc.sendBroadcast(
      req.tenant!.schoolId,
      req.user!.userId,
      parsed.data,
    );
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function getLogs(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(String(req.query.page ?? '1')));
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit ?? '20'))));
    const { channel, type } = req.query as { channel?: string; type?: string };
    const result = await svc.getNotificationLogs(req.tenant!.schoolId, { page, limit, channel, type });
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
}

export async function getInbox(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await svc.getInbox(req.user!.userId, req.tenant!.schoolId);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function markRead(req: Request, res: Response, next: NextFunction) {
  try {
    await svc.markRead(req.params.id!, req.user!.userId);
    res.json({ success: true });
  } catch (err) { next(err); }
}

export async function markAllRead(req: Request, res: Response, next: NextFunction) {
  try {
    await svc.markAllRead(req.user!.userId, req.tenant!.schoolId);
    res.json({ success: true });
  } catch (err) { next(err); }
}

export async function registerDevice(req: Request, res: Response, next: NextFunction) {
  try {
    const { pushToken, platform } = req.body as { pushToken: string; platform: string };
    if (!pushToken || !platform) throw new AppError(422, 'pushToken and platform are required');
    await svc.registerDevice({
      userId: req.user!.userId,
      schoolId: req.tenant!.schoolId,
      pushToken,
      platform,
    });
    res.json({ success: true });
  } catch (err) { next(err); }
}
