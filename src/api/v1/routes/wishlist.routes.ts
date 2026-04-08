import { Router } from 'express';
import * as wishlistController from '../../../controllers/wishlist.controller';
import { authenticate } from '../../../middlewares/auth.middleware';
import { validateQuery } from '../../../middlewares/validate.middleware';
import { listWishlistSchema } from '../../../validators/wishlist.validator';

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     WishlistProductDto:
 *       type: object
 *       properties:
 *         productId:
 *           type: string
 *         addedAt:
 *           type: string
 *           format: date-time
 *     WishlistDto:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         userId:
 *           type: string
 *         products:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/WishlistProductDto'
 *         totalItems:
 *           type: integer
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

// All wishlist routes require authentication
router.use(authenticate);

/**
 * @openapi
 * /api/v1/wishlist:
 *   get:
 *     tags:
 *       - Wishlist
 *     summary: Get user wishlist
 *     description: Returns a paginated list of products in the authenticated user's wishlist.
 *     operationId: getUserWishlist
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
 *     responses:
 *       '200':
 *         description: User wishlist
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
 *                         $ref: '#/components/schemas/ProductDto'
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
 */
router.get('/', validateQuery(listWishlistSchema), wishlistController.list);

/**
 * @openapi
 * /api/v1/wishlist/count:
 *   get:
 *     tags:
 *       - Wishlist
 *     summary: Get wishlist item count
 *     description: Returns the total number of products in the authenticated user's wishlist.
 *     operationId: getWishlistCount
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Wishlist count
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
 *                     total:
 *                       type: integer
 *       '401':
 *         description: Not authenticated
 */
router.get('/count', wishlistController.count);

/**
 * @openapi
 * /api/v1/wishlist/{productId}:
 *   post:
 *     tags:
 *       - Wishlist
 *     summary: Add product to wishlist
 *     description: Adds a product to the authenticated user's wishlist.
 *     operationId: addToWishlist
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '201':
 *         description: Product added to wishlist
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     likeCount:
 *                       type: integer
 *       '401':
 *         description: Not authenticated
 *       '404':
 *         description: Product not found
 *       '409':
 *         description: Product is already in wishlist
 */
router.post('/:productId', wishlistController.add);

/**
 * @openapi
 * /api/v1/wishlist/{productId}:
 *   delete:
 *     tags:
 *       - Wishlist
 *     summary: Remove product from wishlist
 *     description: Removes a product from the authenticated user's wishlist.
 *     operationId: removeFromWishlist
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
 *         description: Product removed from wishlist
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     likeCount:
 *                       type: integer
 *       '401':
 *         description: Not authenticated
 *       '404':
 *         description: Product not found or not in wishlist
 */
router.delete('/:productId', wishlistController.remove);

/**
 * @openapi
 * /api/v1/wishlist/{productId}/toggle:
 *   post:
 *     tags:
 *       - Wishlist
 *     summary: Toggle product in wishlist
 *     description: Adds the product to wishlist if not present, removes it if already present.
 *     operationId: toggleWishlist
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
 *         description: Wishlist toggled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     added:
 *                       type: boolean
 *                     likeCount:
 *                       type: integer
 *       '401':
 *         description: Not authenticated
 *       '404':
 *         description: Product not found
 */
router.post('/:productId/toggle', wishlistController.toggle);

export default router;
