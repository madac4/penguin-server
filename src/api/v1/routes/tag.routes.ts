import { Router } from 'express';
import * as tagController from '../../../controllers/tag.controller';
import { authenticate } from '../../../middlewares/auth.middleware';
import { authorize } from '../../../middlewares/role.middleware';
import { validateBody, validateQuery } from '../../../middlewares/validate.middleware';
import { Role } from '../../../utils/enums';
import {
  createTagSchema,
  listTagsSchema,
  updateTagSchema,
} from '../../../validators/tag.validator';

const router = Router();

// ─── Public Routes ───────────────────────────────────────────────────────────

router.get('/', validateQuery(listTagsSchema), tagController.list);

router.get('/:id', tagController.getById);

// ─── Admin Routes ────────────────────────────────────────────────────────────

router.post(
  '/',
  authenticate,
  authorize(Role.Administrator, Role.Moderator),
  validateBody(createTagSchema),
  tagController.create,
);

router.put(
  '/:id',
  authenticate,
  authorize(Role.Administrator, Role.Moderator),
  validateBody(updateTagSchema),
  tagController.update,
);

router.delete('/:id', authenticate, authorize(Role.Administrator), tagController.remove);

export default router;
