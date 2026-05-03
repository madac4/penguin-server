import { Router } from 'express';
import * as planController from '../../../controllers/subscription-plan.controller';
import { authenticate } from '../../../middlewares/auth.middleware';
import { authorize } from '../../../middlewares/role.middleware';
import { Role } from '../../../utils/enums';

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     SubscriptionPlanDto:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         lsVariantId:
 *           type: string
 *         name:
 *           type: string
 *           description: Pulled live from Lemon Squeezy
 *         description:
 *           type: string
 *           nullable: true
 *           description: Pulled live from Lemon Squeezy
 *         price:
 *           type: number
 *           description: Price in dollars, pulled live from Lemon Squeezy
 *         interval:
 *           type: string
 *           enum: [month, year]
 *           nullable: true
 *           description: Billing interval from Lemon Squeezy
 *         downloadsPerPeriod:
 *           type: integer
 *           description: Number of free downloads granted per billing cycle
 *         imageUrl:
 *           type: string
 *           description: Uploaded via POST /media/upload, stored locally
 *         isActive:
 *           type: boolean
 *         lsEditUrl:
 *           type: string
 *           format: uri
 *           description: Direct link to edit this variant in the Lemon Squeezy dashboard
 *         createdAt:
 *           type: string
 *           format: date-time
 */

/**
 * @openapi
 * /api/v1/subscription-plans:
 *   get:
 *     tags:
 *       - Subscription Plans
 *     summary: List subscription plans
 *     description: Returns active plans for the storefront. Admins see all plans including inactive ones.
 *     operationId: listSubscriptionPlans
 *     responses:
 *       '200':
 *         description: List of plans
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SubscriptionPlanDto'
 */
router.get('/', planController.list);

/**
 * @openapi
 * /api/v1/subscription-plans/{id}:
 *   get:
 *     tags:
 *       - Subscription Plans
 *     summary: Get plan by ID
 *     operationId: getSubscriptionPlanById
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Plan details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/SubscriptionPlanDto'
 *       '404':
 *         description: Plan not found
 */
router.get('/:id', planController.getById);

// ─── Admin ────────────────────────────────────────────────────────────────────

/**
 * @openapi
 * /api/v1/subscription-plans:
 *   post:
 *     tags:
 *       - Subscription Plans
 *     summary: Create a subscription plan (Admin)
 *     operationId: createSubscriptionPlan
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - lsVariantId
 *               - downloadsPerPeriod
 *             properties:
 *               lsVariantId:
 *                 type: string
 *                 description: Variant ID copied from the Lemon Squeezy dashboard
 *               downloadsPerPeriod:
 *                 type: integer
 *                 minimum: 1
 *                 description: Number of free downloads this plan grants per billing cycle
 *     responses:
 *       '201':
 *         description: Plan created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/SubscriptionPlanDto'
 *       '409':
 *         description: Variant ID already in use
 */
router.post('/', authenticate, authorize(Role.Administrator), planController.create);

/**
 * @openapi
 * /api/v1/subscription-plans/{id}:
 *   patch:
 *     tags:
 *       - Subscription Plans
 *     summary: Update a subscription plan (Admin)
 *     operationId: updateSubscriptionPlan
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               downloadsPerPeriod:
 *                 type: integer
 *                 minimum: 1
 *               imageUrl:
 *                 type: string
 *                 description: URL returned by POST /media/upload
 *               isActive:
 *                 type: boolean
 *     responses:
 *       '200':
 *         description: Plan updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/SubscriptionPlanDto'
 *       '404':
 *         description: Plan not found
 *       '409':
 *         description: Variant ID already in use
 */
router.patch('/:id', authenticate, authorize(Role.Administrator), planController.update);

/**
 * @openapi
 * /api/v1/subscription-plans/{id}:
 *   delete:
 *     tags:
 *       - Subscription Plans
 *     summary: Delete a subscription plan (Admin)
 *     operationId: deleteSubscriptionPlan
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '204':
 *         description: Plan deleted
 *       '404':
 *         description: Plan not found
 */
router.delete('/:id', authenticate, authorize(Role.Administrator), planController.remove);

export default router;
