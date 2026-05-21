import { Request, Response, NextFunction } from 'express';
import * as classesService from './classes.service';
import { createClassSchema, updateClassSchema } from './classes.validator';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const classes = await classesService.listClasses(req.tenant.schoolId);
    res.json({ success: true, data: classes });
  } catch (err) { next(err); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createClassSchema.parse(req.body);
    const cls = await classesService.createClass(req.tenant.schoolId, data);
    res.status(201).json({ success: true, data: cls });
  } catch (err) { next(err); }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const data = updateClassSchema.parse(req.body);
    const cls = await classesService.updateClass(req.params.id, req.tenant.schoolId, data);
    res.json({ success: true, data: cls });
  } catch (err) { next(err); }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await classesService.deleteClass(req.params.id, req.tenant.schoolId);
    res.json({ success: true, message: 'Class deleted' });
  } catch (err) { next(err); }
}
