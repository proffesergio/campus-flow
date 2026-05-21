import { Request, Response, NextFunction } from 'express';
import * as service from './practice-materials.service';
import { createMaterialSchema, updateMaterialSchema, materialQuerySchema } from './practice-materials.validator';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const query = materialQuerySchema.parse(req.query);
    // Students only see published materials for their own class
    const isStudent = req.user.role === 'student';
    if (isStudent) query.publishedOnly = true;
    const result = await service.listMaterials(req.tenant.schoolId, query);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createMaterialSchema.parse(req.body);
    const material = await service.createMaterial(req.tenant.schoolId, req.user.userId, data);
    res.status(201).json({ success: true, data: material });
  } catch (err) { next(err); }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const data = updateMaterialSchema.parse(req.body);
    const material = await service.updateMaterial(req.params.id, req.tenant.schoolId, data);
    res.json({ success: true, data: material });
  } catch (err) { next(err); }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await service.deleteMaterial(req.params.id, req.tenant.schoolId);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { next(err); }
}
