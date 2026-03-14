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
 *     ProductProperties:
 *       type: object
 *       properties:
 *         size:
 *           type: string
 *           nullable: true
 *         material:
 *           type: string
 *           nullable: true
 *         color:
 *           type: string
 *           nullable: true
 *         weight:
 *           type: string
 *           nullable: true
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
 *         price:
 *           type: number
 *         viewCount:
 *           type: integer
 *         likeCount:
 *           type: integer
 *         properties:
 *           $ref: '#/components/schemas/ProductProperties'
 *         fileFormats:
 *           type: array
 *           items:
 *             type: string
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
 *         price:
 *           type: number
 *         viewCount:
 *           type: integer
 *         likeCount:
 *           type: integer
 *         properties:
 *           $ref: '#/components/schemas/ProductProperties'
 *         fileFormats:
 *           type: array
 *           items:
 *             type: string
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
 *     description: Returns full product details with populated category and tags. Increments the view counter.
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
 *               price:
 *                 type: number
 *                 default: 0
 *                 description: "Product price in sum. 0 = free."
 *               properties:
 *                 $ref: '#/components/schemas/ProductProperties'
 *               fileFormats:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: e.g. ["STL", "AMF", "3DS"]
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
 *             category: "60d5ec49f1b2c72b7c8e4a1b"
 *             tags: ["60d5ec49f1b2c72b7c8e4a1c"]
 *             price: 20.99
 *             properties:
 *               size: "56 EU / 7.5 US"
 *               material: "Resin"
 *               color: null
 *               weight: "15g"
 *             fileFormats: ["STL", "AMF", "3DS", "3DM"]
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
 *         description: Category or tag not found
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
 *               price:
 *                 type: number
 *               properties:
 *                 $ref: '#/components/schemas/ProductProperties'
 *               fileFormats:
 *                 type: array
 *                 items:
 *                   type: string
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
 *         description: Product, category, or tag not found
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
 *     description: Deletes a product and its associated likes. Images are also removed from storage. Requires Administrator role.
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

export default router;
