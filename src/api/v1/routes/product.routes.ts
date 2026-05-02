import { Router } from 'express';
import * as productController from '../../../controllers/product.controller';
import { authenticate } from '../../../middlewares/auth.middleware';
import { authorize } from '../../../middlewares/role.middleware';
import { validateBody, validateQuery } from '../../../middlewares/validate.middleware';
import { Role } from '../../../utils/enums';
import {
  createProductSchema,
  listProductsSchema,
  updateProductSchema,
} from '../../../validators/product.validator';

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     ProductPropertyInput:
 *       type: object
 *       required:
 *         - definition
 *         - value
 *       properties:
 *         definition:
 *           type: string
 *           description: Property definition ID
 *         value:
 *           type: string
 *           description: Property value
 *     ProductPropertyDto:
 *       type: object
 *       properties:
 *         definition:
 *           type: string
 *           description: Property definition ID
 *         value:
 *           type: string
 *     ProductPropertyDetailDto:
 *       type: object
 *       properties:
 *         definition:
 *           $ref: '#/components/schemas/PropertyDefinitionDto'
 *         value:
 *           type: string
 *     ProductDto:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           $ref: '#/components/schemas/TranslatedField'
 *         description:
 *           $ref: '#/components/schemas/TranslatedField'
 *         slug:
 *           $ref: '#/components/schemas/TranslatedField'
 *         thumbnail:
 *           type: string
 *           description: Thumbnail image URL
 *         images:
 *           type: array
 *           items:
 *             type: string
 *         category:
 *           type: string
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *         isFree:
 *           type: boolean
 *         viewCount:
 *           type: integer
 *         likeCount:
 *           type: integer
 *         properties:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ProductPropertyDto'
 *         isActive:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     ProductDetailDto:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           $ref: '#/components/schemas/TranslatedField'
 *         description:
 *           $ref: '#/components/schemas/TranslatedField'
 *         slug:
 *           $ref: '#/components/schemas/TranslatedField'
 *         thumbnail:
 *           type: string
 *           description: Thumbnail image URL
 *         images:
 *           type: array
 *           items:
 *             type: string
 *         category:
 *           $ref: '#/components/schemas/CategoryDto'
 *         tags:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/TagDto'
 *         isFree:
 *           type: boolean
 *         viewCount:
 *           type: integer
 *         likeCount:
 *           type: integer
 *         properties:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ProductPropertyDetailDto'
 *         isActive:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

// ─── Public Routes ───────────────────────────────────────────────────────────

/**
 * @openapi
 * /api/v1/products:
 *   get:
 *     tags:
 *       - Products
 *     summary: Paginated list of products
 *     description: Returns a paginated list of products. Supports bilingual fuzzy search, filtering by category, tag, and active status.
 *     operationId: listProducts
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
 *         name: search
 *         description: Search in product names and descriptions (works in both English and Russian)
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         description: Filter by category ID
 *         schema:
 *           type: string
 *       - in: query
 *         name: tag
 *         description: Filter by tag ID
 *         schema:
 *           type: string
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       '200':
 *         description: Paginated list of products
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
 */
router.get('/', validateQuery(listProductsSchema), productController.list);

/**
 * @openapi
 * /api/v1/products/{id}:
 *   get:
 *     tags:
 *       - Products
 *     summary: Get product by ID
 *     description: Returns full product details with populated category, tags, and property definitions. Increments the view counter.
 *     operationId: getProductById
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Product details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ProductDetailDto'
 *       '404':
 *         description: Product not found
 */
router.get('/:id', productController.getById);

// ─── Admin Routes ────────────────────────────────────────────────────────────

/**
 * @openapi
 * /api/v1/products:
 *   post:
 *     tags:
 *       - Products
 *     summary: Create a product
 *     description: Creates a new product. Requires Administrator role.
 *     operationId: createProduct
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - category
 *             properties:
 *               name:
 *                 $ref: '#/components/schemas/TranslatedField'
 *               description:
 *                 $ref: '#/components/schemas/TranslatedField'
 *               thumbnail:
 *                 type: string
 *                 description: Thumbnail image URL
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *               category:
 *                 type: string
 *                 description: Category ID
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of Tag IDs
 *               isFree:
 *                 type: boolean
 *                 default: false
 *                 description: If true, anyone can download without a subscription.
 *               properties:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/ProductPropertyInput'
 *                 description: Dynamic product properties (definition ID + value)
 *               isActive:
 *                 type: boolean
 *                 default: true
 *           example:
 *             name:
 *               en: "Motion Ring Size 56 EU"
 *               ru: "Кольцо Движения Размер 56 EU"
 *             description:
 *               en: "An imitation of the iconic motion ring from the signature collection"
 *               ru: "Имитация культового кольца движения из фирменной коллекции"
 *             thumbnail: "https://cdn.example.com/products/ring-thumb.webp"
 *             category: "60d5ec49f1b2c72b7c8e4a1b"
 *             tags: ["60d5ec49f1b2c72b7c8e4a1c"]
 *             isFree: false
 *             properties:
 *               - definition: "60d5ec49f1b2c72b7c8e4a1d"
 *                 value: "56 EU / 7.5 US"
 *               - definition: "60d5ec49f1b2c72b7c8e4a1e"
 *                 value: "15g"
 *     responses:
 *       '201':
 *         description: Product created
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
 *                   $ref: '#/components/schemas/ProductDto'
 *       '400':
 *         description: Validation error
 *       '401':
 *         description: Not authenticated
 *       '403':
 *         description: Insufficient permissions
 *       '404':
 *         description: Category, tag, or property definition not found
 *       '409':
 *         description: Product with this name already exists
 */
router.post(
  '/',
  authenticate,
  authorize(Role.Administrator),
  validateBody(createProductSchema),
  productController.create,
);

/**
 * @openapi
 * /api/v1/products/{id}:
 *   put:
 *     tags:
 *       - Products
 *     summary: Update a product
 *     description: Updates an existing product. Requires Administrator role. All fields are optional.
 *     operationId: updateProduct
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
 *               name:
 *                 $ref: '#/components/schemas/TranslatedField'
 *               description:
 *                 $ref: '#/components/schemas/TranslatedField'
 *               thumbnail:
 *                 type: string
 *                 description: Thumbnail image URL
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *               category:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               isFree:
 *                 type: boolean
 *               properties:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/ProductPropertyInput'
 *               isActive:
 *                 type: boolean
 *     responses:
 *       '200':
 *         description: Product updated
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
 *                   $ref: '#/components/schemas/ProductDto'
 *       '400':
 *         description: Validation error
 *       '401':
 *         description: Not authenticated
 *       '403':
 *         description: Insufficient permissions
 *       '404':
 *         description: Product, category, tag, or property definition not found
 */
router.put(
  '/:id',
  authenticate,
  authorize(Role.Administrator),
  validateBody(updateProductSchema),
  productController.update,
);

/**
 * @openapi
 * /api/v1/products/{id}:
 *   delete:
 *     tags:
 *       - Products
 *     summary: Delete a product
 *     description: Deletes a product and removes it from all wishlists. Thumbnail and images are also removed from storage. Requires Administrator role.
 *     operationId: deleteProduct
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
 *         description: Product deleted
 *       '401':
 *         description: Not authenticated
 *       '403':
 *         description: Insufficient permissions
 *       '404':
 *         description: Product not found
 */
router.delete('/:id', authenticate, authorize(Role.Administrator), productController.remove);

/**
 * @openapi
 * /api/v1/products/{id}/download:
 *   get:
 *     tags:
 *       - Products
 *     summary: Request a signed download URL for a product's STL file
 *     description: Returns a short-lived presigned URL the client can use to download the STL. For paid products, an active subscription with remaining download credits is required; one credit is consumed per request. Free products bypass the gate.
 *     operationId: downloadProduct
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
 *         description: Signed download URL
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
 *                     url:
 *                       type: string
 *                       format: uri
 *       '401':
 *         description: Not authenticated
 *       '403':
 *         description: No active subscription / credits exhausted
 *       '404':
 *         description: Product not found or has no downloadable file
 */
router.get('/:id/download', authenticate, productController.download);

export default router;
