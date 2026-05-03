import { Router } from 'express'
import * as cartController from '../../../controllers/cart.controller'
import { authenticate } from '../../../middlewares/auth.middleware'
import { validateBody } from '../../../middlewares/validate.middleware'
import { addCartItemSchema, mergeCartSchema } from '../../../validators/cart.validator'

const router = Router()

/**
 * @openapi
 * components:
 *   schemas:
 *     CartItemDto:
 *       type: object
 *       properties:
 *         productId:
 *           type: string
 *         product:
 *           $ref: '#/components/schemas/ProductDto'
 *         addedAt:
 *           type: string
 *           format: date-time
 *     CartDto:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         userId:
 *           type: string
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CartItemDto'
 *         status:
 *           type: string
 *           enum: [active, checked_out, expired]
 *         itemCount:
 *           type: integer
 *         total:
 *           type: number
 *         expiresAt:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

// All cart routes require authentication
router.use(authenticate)

/**
 * @openapi
 * /api/v1/carts/me:
 *   get:
 *     tags:
 *       - Cart
 *     summary: Get current user cart
 *     description: Returns the authenticated user's active cart, creating one if it doesn't exist.
 *     operationId: getCart
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: User cart
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/CartDto'
 *       '401':
 *         description: Not authenticated
 */
router.get('/me', cartController.get)

/**
 * @openapi
 * /api/v1/carts/merge:
 *   post:
 *     tags:
 *       - Cart
 *     summary: Merge guest cart into user cart
 *     description: Called once after login/registration to merge items stored client-side into the DB cart. Silently skips invalid, free, or already-owned products.
 *     operationId: mergeCart
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - productId
 *                   properties:
 *                     productId:
 *                       type: string
 *     responses:
 *       '200':
 *         description: Merged cart
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/CartDto'
 *       '401':
 *         description: Not authenticated
 */
router.post('/merge', validateBody(mergeCartSchema), cartController.merge)

/**
 * @openapi
 * /api/v1/carts/checkout:
 *   post:
 *     tags:
 *       - Cart
 *     summary: Create checkout from cart
 *     description: Validates the cart and creates a Lemon Squeezy checkout URL. The cart is marked as checked_out once the payment webhook fires.
 *     operationId: cartCheckout
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Checkout URL
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
 *       '400':
 *         description: Cart is empty or contains invalid products
 *       '401':
 *         description: Not authenticated
 */
router.post('/checkout', cartController.checkout)

/**
 * @openapi
 * /api/v1/carts/items:
 *   post:
 *     tags:
 *       - Cart
 *     summary: Add item to cart
 *     description: Adds a single product to the authenticated user's cart. Validates the product is active, paid, and not already owned.
 *     operationId: addCartItem
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *             properties:
 *               productId:
 *                 type: string
 *     responses:
 *       '201':
 *         description: Item added
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/CartDto'
 *       '400':
 *         description: Product not available or is free
 *       '401':
 *         description: Not authenticated
 *       '404':
 *         description: Product not found
 *       '409':
 *         description: Product already in cart or already owned
 */
router.post('/items', validateBody(addCartItemSchema), cartController.addItem)

/**
 * @openapi
 * /api/v1/carts/items:
 *   delete:
 *     tags:
 *       - Cart
 *     summary: Clear all cart items
 *     description: Removes all items from the cart without deleting the cart record.
 *     operationId: clearCart
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Cart cleared
 *       '401':
 *         description: Not authenticated
 */
router.delete('/items', cartController.clear)

/**
 * @openapi
 * /api/v1/carts/items/{productId}:
 *   delete:
 *     tags:
 *       - Cart
 *     summary: Remove item from cart
 *     description: Removes a single product from the authenticated user's cart.
 *     operationId: removeCartItem
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Item removed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/CartDto'
 *       '401':
 *         description: Not authenticated
 *       '404':
 *         description: Cart or product not found
 */
router.delete('/items/:productId', cartController.removeItem)

export default router
