import { Router } from 'express';
import * as planController from '../../../controllers/plan.controller';
import { authenticate } from '../../../middlewares/auth.middleware';
import { authorize } from '../../../middlewares/role.middleware';
import { validateBody, validateQuery } from '../../../middlewares/validate.middleware';
import { Role } from '../../../utils/enums';
import {
  createPlanSchema,
  listPlansSchema,
  updatePlanSchema,
} from '../../../validators/plan.validator';

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     PlanDto:
 *       type: object
 *       properties:
 *         id: { type: string }
 *         name: { $ref: '#/components/schemas/TranslatedField' }
 *         slug: { type: string }
 *         downloadCredits: { type: integer }
 *         durationDays: { type: integer }
 *         priceCents: { type: integer }
 *         isPopular: { type: boolean }
 *         isActive: { type: boolean }
 *         sortOrder: { type: integer }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 */

/**
 * @openapi
 * /api/v1/plans:
 *   get:
 *     tags: [Plans]
 *     summary: List subscription plans (public)
 *     operationId: listPlans
 *     parameters:
 *       - in: query
 *         name: isActive
 *         schema: { type: boolean }
 *     responses:
 *       '200': { description: Paginated plans }
 */
router.get('/', validateQuery(listPlansSchema), planController.list);

router.get('/:id', authenticate, authorize(Role.Administrator), planController.getById);

/**
 * @openapi
 * /api/v1/plans:
 *   post:
 *     tags: [Plans]
 *     summary: Create a plan (admin)
 *     operationId: createPlan
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/',
  authenticate,
  authorize(Role.Administrator),
  validateBody(createPlanSchema),
  planController.create,
);

router.put(
  '/:id',
  authenticate,
  authorize(Role.Administrator),
  validateBody(updatePlanSchema),
  planController.update,
);

router.delete('/:id', authenticate, authorize(Role.Administrator), planController.remove);

export default router;
