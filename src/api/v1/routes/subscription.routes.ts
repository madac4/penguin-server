import { Router } from 'express';
import * as subscriptionController from '../../../controllers/subscription.controller';
import { authenticate } from '../../../middlewares/auth.middleware';
import { authorize } from '../../../middlewares/role.middleware';
import { validateBody } from '../../../middlewares/validate.middleware';
import { Role } from '../../../utils/enums';
import { grantSubscriptionSchema } from '../../../validators/subscription.validator';

const router = Router();

/**
 * @openapi
 * /api/v1/subscriptions/me:
 *   get:
 *     tags: [Subscriptions]
 *     summary: Current user's active subscription (or null)
 *     security:
 *       - bearerAuth: []
 */
router.get('/me', authenticate, subscriptionController.getMine);

/**
 * @openapi
 * /api/v1/subscriptions/users/{userId}:
 *   get:
 *     tags: [Subscriptions]
 *     summary: List a user's subscriptions (admin)
 *     security:
 *       - bearerAuth: []
 *   post:
 *     tags: [Subscriptions]
 *     summary: Grant a subscription to a user (admin)
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/users/:userId',
  authenticate,
  authorize(Role.Administrator),
  subscriptionController.listForUser,
);

router.post(
  '/users/:userId',
  authenticate,
  authorize(Role.Administrator),
  validateBody(grantSubscriptionSchema),
  subscriptionController.grant,
);

/**
 * @openapi
 * /api/v1/subscriptions/{id}:
 *   delete:
 *     tags: [Subscriptions]
 *     summary: Cancel a subscription (admin)
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  '/:id',
  authenticate,
  authorize(Role.Administrator),
  subscriptionController.cancel,
);

export default router;
