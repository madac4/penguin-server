import { Router } from 'express';
import * as orderController from '../../../controllers/order.controller';
import { authenticate } from '../../../middlewares/auth.middleware';
import { authorize } from '../../../middlewares/role.middleware';
import { Role } from '../../../utils/enums';

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     OrderDto:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         userId:
 *           type: string
 *         products:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ProductDto'
 *         lsOrderId:
 *           type: string
 *           description: Lemon Squeezy order ID
 *         total:
 *           type: integer
 *           description: Total amount in cents
 *         currency:
 *           type: string
 *           example: USD
 *         receiptUrl:
 *           type: string
 *           format: uri
 *         status:
 *           type: string
 *           enum: [paid, refunded]
 *         createdAt:
 *           type: string
 *           format: date-time
 */

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

// ─── Admin Routes ─────────────────────────────────────────────────────────────

/**
 * @openapi
 * /api/v1/orders:
 *   get:
 *     tags:
 *       - Orders
 *     summary: List all orders (Admin)
 *     description: Returns a paginated list of all orders across all users. Supports filtering by status and userId.
 *     operationId: adminListOrders
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
 *         description: Filter by order status
 *         schema:
 *           type: string
 *           enum: [paid, refunded]
 *       - in: query
 *         name: userId
 *         description: Filter by user ID
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Paginated list of orders
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
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           userId:
 *                             type: string
 *                           products:
 *                             type: array
 *                             items:
 *                               $ref: '#/components/schemas/ProductDto'
 *                           lsOrderId:
 *                             type: string
 *                           total:
 *                             type: integer
 *                           currency:
 *                             type: string
 *                           receiptUrl:
 *                             type: string
 *                           status:
 *                             type: string
 *                             enum: [paid, refunded]
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       '401':
 *         description: Not authenticated
 *       '403':
 *         description: Insufficient permissions
 */
router.get('/', authenticate, authorize(Role.Administrator), orderController.adminList);

/**
 * @openapi
 * /api/v1/orders/{id}:
 *   get:
 *     tags:
 *       - Orders
 *     summary: Get order by ID (Admin)
 *     description: Returns a single order with all products and receipt details.
 *     operationId: adminGetOrderById
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Order details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/OrderDto'
 *       '401':
 *         description: Not authenticated
 *       '403':
 *         description: Insufficient permissions
 *       '404':
 *         description: Order not found
 */
router.get('/:id', authenticate, authorize(Role.Administrator), orderController.adminGetById);

export default router;
