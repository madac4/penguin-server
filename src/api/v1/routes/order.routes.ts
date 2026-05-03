import { Router } from 'express';
import * as orderController from '../../../controllers/order.controller';
import { authenticate } from '../../../middlewares/auth.middleware';

const router = Router();

/**
 * @openapi
 * /api/v1/orders/checkout:
 *   post:
 *     tags:
 *       - Orders
 *     summary: Create a Lemon Squeezy checkout session
 *     description: |
 *       Accepts one or more product IDs, validates them, calculates the total, and returns
 *       a Lemon Squeezy hosted checkout URL. Redirect the user to that URL to complete payment.
 *       After payment Lemon Squeezy fires the `order_created` webhook which records the order.
 *     operationId: createOrderCheckout
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productIds
 *             properties:
 *               productIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 minItems: 1
 *                 description: IDs of the products to purchase
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
 *         description: Empty array, free products included, or product already owned
 *       '401':
 *         description: Not authenticated
 *       '404':
 *         description: One or more products not found
 */
router.post('/checkout', authenticate, orderController.checkout);

/**
 * @openapi
 * /api/v1/orders/webhook:
 *   post:
 *     tags:
 *       - Orders
 *     summary: Lemon Squeezy webhook receiver
 *     description: |
 *       Called by Lemon Squeezy after payment events. Verifies the `X-Signature` HMAC header
 *       and processes `order_created` (creates order) and `order_refunded` (marks as refunded).
 *     operationId: orderWebhook
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
router.post('/webhook', orderController.webhook);

/**
 * @openapi
 * /api/v1/orders/me:
 *   get:
 *     tags:
 *       - Orders
 *     summary: List the current user's orders
 *     description: Returns all orders for the authenticated user, newest first. Each order includes the purchased products and the Lemon Squeezy receipt URL.
 *     operationId: listMyOrders
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: List of orders
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
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       products:
 *                         type: array
 *                         items:
 *                           $ref: '#/components/schemas/ProductDto'
 *                       lsOrderId:
 *                         type: string
 *                       total:
 *                         type: integer
 *                         description: Total amount in cents
 *                       currency:
 *                         type: string
 *                       receiptUrl:
 *                         type: string
 *                         format: uri
 *                       status:
 *                         type: string
 *                         enum: [paid, refunded]
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       '401':
 *         description: Not authenticated
 */
router.get('/me', authenticate, orderController.list);

export default router;
