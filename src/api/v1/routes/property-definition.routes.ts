import { Router } from 'express';
import * as propertyDefinitionController from '../../../controllers/property-definition.controller';
import { authenticate } from '../../../middlewares/auth.middleware';
import { authorize } from '../../../middlewares/role.middleware';
import { validateBody, validateQuery } from '../../../middlewares/validate.middleware';
import { Role } from '../../../utils/enums';
import {
  createPropertyDefinitionSchema,
  listPropertyDefinitionsSchema,
  updatePropertyDefinitionSchema,
} from '../../../validators/property-definition.validator';

const router = Router();

// ─── Public Routes ───────────────────────────────────────────────────────────

router.get('/', validateQuery(listPropertyDefinitionsSchema), propertyDefinitionController.list);

router.get('/:id', propertyDefinitionController.getById);

// ─── Admin Routes ────────────────────────────────────────────────────────────

router.post(
  '/',
  authenticate,
  authorize(Role.Administrator),
  validateBody(createPropertyDefinitionSchema),
  propertyDefinitionController.create,
);

router.put(
  '/:id',
  authenticate,
  authorize(Role.Administrator),
  validateBody(updatePropertyDefinitionSchema),
  propertyDefinitionController.update,
);

router.delete(
  '/:id',
  authenticate,
  authorize(Role.Administrator),
  propertyDefinitionController.remove,
);

export default router;
