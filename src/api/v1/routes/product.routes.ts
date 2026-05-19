import { Router } from 'express';
import * as productController from '../../../controllers/product.controller';
import { authenticate, optionalAuthenticate } from '../../../middlewares/auth.middleware';
import { authorize } from '../../../middlewares/role.middleware';
import { validateBody, validateQuery } from '../../../middlewares/validate.middleware';
import { Role } from '../../../utils/enums';
import {
  createProductSchema,
  listProductsSchema,
  updateProductSchema,
} from '../../../validators/product.validator';

const router = Router();

// ─── Public Routes ───────────────────────────────────────────────────────────

router.get('/', validateQuery(listProductsSchema), productController.list);

router.get('/filters', productController.filters);

router.get('/:id', optionalAuthenticate, productController.getById);

// ─── Admin Routes ────────────────────────────────────────────────────────────

router.post(
  '/',
  authenticate,
  authorize(Role.Administrator, Role.Moderator),
  validateBody(createProductSchema),
  productController.create,
);

router.put(
  '/:id',
  authenticate,
  authorize(Role.Administrator, Role.Moderator),
  validateBody(updateProductSchema),
  productController.update,
);

router.delete('/:id', authenticate, authorize(Role.Administrator), productController.remove);

router.post('/:id/acquire', authenticate, productController.acquire);

export default router;
