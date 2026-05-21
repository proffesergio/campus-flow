import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import * as ctrl from './practice-materials.controller';

const router = Router();

router.use(authenticate);

// All authenticated users can list (students see published only — filtered in controller)
router.get('/', ctrl.list);

// Teachers and admins create/update/delete
router.post('/', requireRole('school_admin', 'teacher'), ctrl.create);
router.put('/:id', requireRole('school_admin', 'teacher'), ctrl.update);
router.delete('/:id', requireRole('school_admin', 'teacher'), ctrl.remove);

export default router;
