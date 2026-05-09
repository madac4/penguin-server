import { Router } from 'express';
import * as productController from '../../../controllers/product.controller';
import { authenticate, optionalAuthenticate } from '../../../middlewares/auth.middleware';
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
 *     ProductFileInput:
 *       type: object
 *       required:
 *         - url
 *         - filename
 *         - format
 *         - size
 *       properties:
 *         url:
 *           type: string
 *           format: uri
 *           description: Public R2 URL returned by POST /media/upload
 *         filename:
 *           type: string
 *           description: Original filename (from MediaDto.filename)
 *         format:
 *           type: string
 *           description: File format derived from extension (e.g. STL, GLB, OBJ)
 *         size:
 *           type: integer
 *           description: File size in bytes (from MediaDto.size)
 *     ProductFileDto:
 *       type: object
 *       properties:
 *         url:
 *           type: string
 *           description: Public URL of the uploaded 3D model file
 *         filename:
 *           type: string
 *           description: Original filename
 *         format:
 *           type: string
 *           description: File format (e.g. STL, GLB, OBJ)
 *         size:
 *           type: integer
 *           description: File size in bytes
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
 *         files:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ProductFileDto'
 *           description: Uploaded 3D model files
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
 *         files:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ProductFileDto'
 *           description: Uploaded 3D model files
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
 *     description: Returns a paginated list of products. Supports bilingual fuzzy search, sorting, price range, format, and dynamic property filters.
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
 *         description: Bilingual fuzzy search across names and descriptions
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortBy
 *         description: Sort order
 *         schema:
 *           type: string
 *           enum: [newest, price_asc, price_desc, popular]
 *           default: newest
 *       - in: query
 *         name: category
 *         description: Filter by category ID
 *         schema:
 *           type: string
 *       - in: query
 *         name: tags
 *         description: "Comma-separated tag IDs. Products matching ANY of the specified tags are returned. Example: id1,id2"
 *         schema:
 *           type: string
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: priceMin
 *         description: Minimum price (inclusive)
 *         schema:
 *           type: number
 *           minimum: 0
 *       - in: query
 *         name: priceMax
 *         description: Maximum price (inclusive)
 *         schema:
 *           type: number
 *           minimum: 0
 *       - in: query
 *         name: formats
 *         description: "Comma-separated list of 3D file formats to filter by. Example: STL,GLB,OBJ"
 *         schema:
 *           type: string
 *       - in: query
 *         name: properties
 *         description: "Comma-separated definitionId:value pairs. ALL pairs must match (AND logic across definitions). Example: 64abc:gold,64def:modern"
 *         schema:
 *           type: string
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
 * /api/v1/products/filters:
 *   get:
 *     tags:
 *       - Products
 *     summary: Available filters for the product list
 *     description: |
 *       Returns all filter options that are actually present in active products,
 *       optionally scoped to a category. Use this to populate dynamic filter panels on the storefront.
 *     operationId: getProductFilters
 *     parameters:
 *       - in: query
 *         name: category
 *         description: Scope filters to products in this category ID
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Available filters
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
 *                     priceRange:
 *                       type: object
 *                       properties:
 *                         min:
 *                           type: number
 *                         max:
 *                           type: number
 *                     formats:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: Distinct 3D file formats present in products (e.g. ["GLB","OBJ","STL"])
 *                     tags:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/TagDto'
 *                     properties:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           definition:
 *                             $ref: '#/components/schemas/PropertyDefinitionDto'
 *                           values:
 *                             type: array
 *                             items:
 *                               type: string
 *                             description: Sorted list of distinct values for this property across matching products
 */
router.get('/filters', productController.filters);

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
router.get('/:id', optionalAuthenticate, productController.getById);

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
 *                 description: Thumbnail image URL (upload via /media/upload first)
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Image URLs (upload via /media/upload first)
 *               files:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/ProductFileInput'
 *                 description: 3D model files (upload via /media/upload first, then pass metadata here)
 *               category:
 *                 type: string
 *                 description: Category ID
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Tag IDs
 *               price:
 *                 type: number
 *                 default: 0
 *               properties:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/ProductPropertyInput'
 *               isActive:
 *                 type: boolean
 *                 default: true
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
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *               files:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/ProductFileInput'
 *                 description: Full replacement of the 3D files list. Omit to leave unchanged.
 *               category:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               price:
 *                 type: number
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
 *     description: Deletes a product and removes it from collections and downloads. Thumbnail and images are also removed from storage. Requires Administrator role.
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
 * /api/v1/products/{id}/acquire:
 *   post:
 *     tags:
 *       - Products
 *     summary: Acquire a product
 *     description: Consumes one download quota from the active subscription and permanently adds the product to the user's library. Optionally assigns it to a collection; defaults to "Uncategorized" if omitted.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               collectionId:
 *                 type: string
 *                 description: Optional. Assign to this collection; omit to use Uncategorized.
 *     responses:
 *       '201':
 *         description: Product acquired
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 collectionId:
 *                   type: string
 *       '403':
 *         description: No active subscription or quota exceeded
 *       '404':
 *         description: Product not found
 *       '409':
 *         description: Already acquired
 */
router.post('/:id/acquire', authenticate, productController.acquire);

export default router;
