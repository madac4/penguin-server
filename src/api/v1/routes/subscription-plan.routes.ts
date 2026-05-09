import { Router } from 'express';
import * as planController from '../../../controllers/subscription-plan.controller';
import { authenticate } from '../../../middlewares/auth.middleware';
import { authorize } from '../../../middlewares/role.middleware';
import { Role } from '../../../utils/enums';

const router = Router();

router.get('/', planController.list);

router.get('/:id', planController.getById);

// ─── Admin ────────────────────────────────────────────────────────────────────

router.post('/', authenticate, authorize(Role.Administrator), planController.create);

router.patch('/:id', authenticate, authorize(Role.Administrator), planController.update);

router.delete('/:id', authenticate, authorize(Role.Administrator), planController.remove);

export default router;
