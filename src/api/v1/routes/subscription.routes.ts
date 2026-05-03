import { Router } from 'express';
import * as subscriptionController from '../../../controllers/subscription.controller';
import { authenticate } from '../../../middlewares/auth.middleware';
import { authorize } from '../../../middlewares/role.middleware';
import { Role } from '../../../utils/enums';

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     SubscriptionDto:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         userId:
 *           type: string
 *         plan:
 *           $ref: '#/components/schemas/SubscriptionPlanDto'
 *         lsSubscriptionId:
 *           type: string
 *         status:
 *           type: string
 *           enum: [active, cancelled, expired, past_due]
 *         downloadsUsed:
 *           type: integer
 *         downloadsRemaining:
 *           type: integer
 *         renewsAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         cancelledAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 */

/**
 * @openapi
 * /api/v1/subscriptions/checkout:
 *   post:
 *     tags:
 *       - Subscriptions
 *     summary: Create a subscription checkout session
 *     description: Returns a Lemon Squeezy hosted checkout URL for the selected plan.
 *     operationId: createSubscriptionCheckout
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - planId
 *             properties:
 *               planId:
 *                 type: string
 *                 description: Subscription plan ID from GET /subscription-plans
 *     responses:
 *       '200':
 *         description: Checkout URL created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     checkoutUrl:
 *                       type: string
 *                       format: uri
 *       '400':
 *         description: Already subscribed or plan inactive
 *       '401':
 *         description: Not authenticated
 *       '404':
 *         description: Plan not found
 */
/**
 * @openapi
 * /api/v1/subscriptions/webhook:
 *   post:
 *     tags:
 *       - Subscriptions
 *     summary: Lemon Squeezy subscription webhook receiver
 *     description: |
 *       Called by Lemon Squeezy for subscription lifecycle events. Verifies the `X-Signature`
 *       HMAC header using the subscription webhook secret (separate from the orders webhook secret).
 *     operationId: subscriptionWebhook
 *     parameters:
 *       - in: header
 *         name: X-Signature
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Webhook received
 *       '400':
 *         description: Missing signature or body
 *       '401':
 *         description: Invalid signature
 */
router.post('/webhook', subscriptionController.webhook);

router.post('/checkout', authenticate, subscriptionController.checkout);

/**
 * @openapi
 * /api/v1/subscriptions/me:
 *   get:
 *     tags:
 *       - Subscriptions
 *     summary: Get current user's subscription
 *     operationId: getMySubscription
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Current subscription or null
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   oneOf:
 *                     - $ref: '#/components/schemas/SubscriptionDto'
 *                     - type: 'null'
 *       '401':
 *         description: Not authenticated
 */
router.get('/me', authenticate, subscriptionController.getMySubscription);

/**
 * @openapi
 * /api/v1/subscriptions/me:
 *   delete:
 *     tags:
 *       - Subscriptions
 *     summary: Cancel current user's subscription
 *     description: Cancels the subscription in Lemon Squeezy. Access continues until the current period ends, then the webhook marks it expired.
 *     operationId: cancelMySubscription
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '204':
 *         description: Cancellation initiated
 *       '400':
 *         description: Subscription is not active
 *       '401':
 *         description: Not authenticated
 *       '404':
 *         description: No active subscription found
 */
router.delete('/me', authenticate, subscriptionController.cancel);

/**
 * @openapi
 * /api/v1/subscriptions:
 *   get:
 *     tags:
 *       - Subscriptions
 *     summary: List all subscriptions (Admin)
 *     operationId: adminListSubscriptions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, cancelled, expired, past_due]
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Paginated list of subscriptions
 *       '401':
 *         description: Not authenticated
 *       '403':
 *         description: Insufficient permissions
 */
router.get('/', authenticate, authorize(Role.Administrator), subscriptionController.adminList);

export default router;
