import { Request, Response, NextFunction } from 'express';
import * as schoolsService from './schools.service';
import { updateSchoolSchema } from './schools.validator';

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const school = await schoolsService.getMySchool(req.tenant.schoolId);
    res.json({ success: true, data: school });
  } catch (err) { next(err); }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const data = updateSchoolSchema.parse(req.body);
    const school = await schoolsService.updateMySchool(req.tenant.schoolId, data);
    res.json({ success: true, data: school, message: 'School settings updated' });
  } catch (err) { next(err); }
}
