import { Router } from 'express'
import * as categoryController from '../../../controllers/category.controller'
import { authenticate } from '../../../middlewares/auth.middleware'
import { authorize } from '../../../middlewares/role.middleware'
import { validateBody, validateQuery } from '../../../middlewares/validate.middleware'
import { Role } from '../../../utils/enums'
import {
	createCategorySchema,
	listCategoriesSchema,
	updateCategorySchema,
} from '../../../validators/category.validator'

const router = Router();

// ─── Public Routes ───────────────────────────────────────────────────────────

router.get('/', validateQuery(listCategoriesSchema), categoryController.list);

router.get('/tree', categoryController.getTree);

router.get('/:id', authenticate, authorize(Role.Administrator), categoryController.getById);

// ─── Admin Routes ────────────────────────────────────────────────────────────

router.post(
  '/',
  authenticate,
  authorize(Role.Administrator),
  validateBody(createCategorySchema),
  categoryController.create,
);

router.put(
  '/:id',
  authenticate,
  authorize(Role.Administrator),
  validateBody(updateCategorySchema),
  categoryController.update,
);

router.patch(
  '/:id/sort-order',
  authenticate,
  authorize(Role.Administrator),
  categoryController.updateSortOrder,
);

router.delete(
  '/:id',
  authenticate,
  authorize(Role.Administrator),
  categoryController.remove,
);

export default router;
