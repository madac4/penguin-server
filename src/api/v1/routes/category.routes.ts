import { Router } from 'express'
import * as categoryController from '../../../controllers/category.controller'
import { authenticate } from '../../../middlewares/auth.middleware'
import { authorize } from '../../../middlewares/role.middleware'
import { validateBody, validateQuery } from '../../../middlewares/validate.middleware'
import { Role } from '../../../utils/enums'
import {
	createCategorySchema,
	listCategoriesSchema,
	updateCategorySchema,
} from '../../../validators/category.validator'

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     TranslatedField:
 *       type: object
 *       required:
 *         - en
 *         - ru
 *       properties:
 *         en:
 *           type: string
 *         ru:
 *           type: string
 *     CategoryDto:
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
 *         parent:
 *           type: string
 *           nullable: true
 *         image:
 *           type: string
 *           nullable: true
 *         sortOrder:
 *           type: integer
 *         isActive:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     CategoryTreeDto:
 *       allOf:
 *         - $ref: '#/components/schemas/CategoryDto'
 *         - type: object
 *           properties:
 *             children:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CategoryTreeDto'
 */

// ─── Public Routes ───────────────────────────────────────────────────────────

/**
 * @openapi
 * /api/v1/categories:
 *   get:
 *     tags:
 *       - Categories
 *     summary: Paginated list of categories
 *     description: Returns a paginated list of categories. Supports bilingual search (en/ru) and filtering by isActive status and parent.
 *     operationId: listCategories
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
 *         description: Search in category names and descriptions (works in both English and Russian)
 *         schema:
 *           type: string
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: parent
 *         description: Filter by parent category ID. Use 'null' for root categories.
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Paginated list of categories
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
 *                         $ref: '#/components/schemas/CategoryDto'
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 */
router.get('/', validateQuery(listCategoriesSchema), categoryController.list);

/**
 * @openapi
 * /api/v1/categories/tree:
 *   get:
 *     tags:
 *       - Categories
 *     summary: Get category tree
 *     description: Returns all active categories as a nested tree structure.
 *     operationId: getCategoryTree
 *     responses:
 *       '200':
 *         description: Category tree
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
 *                     $ref: '#/components/schemas/CategoryTreeDto'
 */
router.get('/tree', categoryController.getTree);

/**
 * @openapi
 * /api/v1/categories/{id}:
 *   get:
 *     tags:
 *       - Categories
 *     summary: Get category by ID
 *     operationId: getCategoryById
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
 *         description: Category details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/CategoryDto'
 *       '404':
 *         description: Category not found
 */
router.get('/:id', authenticate, authorize(Role.Administrator), categoryController.getById);

// ─── Admin Routes ────────────────────────────────────────────────────────────

/**
 * @openapi
 * /api/v1/categories:
 *   post:
 *     tags:
 *       - Categories
 *     summary: Create a category
 *     description: Creates a new category with bilingual name and description. Requires Administrator role.
 *     operationId: createCategory
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
 *             properties:
 *               name:
 *                 $ref: '#/components/schemas/TranslatedField'
 *               description:
 *                 $ref: '#/components/schemas/TranslatedField'
 *               parent:
 *                 type: string
 *                 nullable: true
 *                 description: Parent category ID
 *               image:
 *                 type: string
 *                 nullable: true
 *               sortOrder:
 *                 type: integer
 *                 default: 0
 *               isActive:
 *                 type: boolean
 *                 default: true
 *           example:
 *             name:
 *               en: "Rings"
 *               ru: "Кольца"
 *             description:
 *               en: "Jewelry rings collection"
 *               ru: "Коллекция ювелирных колец"
 *     responses:
 *       '201':
 *         description: Category created
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
 *                   $ref: '#/components/schemas/CategoryDto'
 *       '400':
 *         description: Validation error
 *       '401':
 *         description: Not authenticated
 *       '403':
 *         description: Insufficient permissions
 *       '409':
 *         description: Category with this name already exists
 */
router.post(
  '/',
  authenticate,
  authorize(Role.Administrator),
  validateBody(createCategorySchema),
  categoryController.create,
);

/**
 * @openapi
 * /api/v1/categories/{id}:
 *   put:
 *     tags:
 *       - Categories
 *     summary: Update a category
 *     description: Updates an existing category. Requires Administrator role. All fields are optional.
 *     operationId: updateCategory
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
 *               parent:
 *                 type: string
 *                 nullable: true
 *               image:
 *                 type: string
 *                 nullable: true
 *               sortOrder:
 *                 type: integer
 *               isActive:
 *                 type: boolean
 *     responses:
 *       '200':
 *         description: Category updated
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
 *                   $ref: '#/components/schemas/CategoryDto'
 *       '400':
 *         description: Validation error
 *       '401':
 *         description: Not authenticated
 *       '403':
 *         description: Insufficient permissions
 *       '404':
 *         description: Category not found
 */
router.put(
  '/:id',
  authenticate,
  authorize(Role.Administrator),
  validateBody(updateCategorySchema),
  categoryController.update,
);

/**
 * @openapi
 * /api/v1/categories/{id}:
 *   delete:
 *     tags:
 *       - Categories
 *     summary: Delete a category
 *     description: Deletes a category. Will fail if the category has child categories. Requires Administrator role.
 *     operationId: deleteCategory
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
 *         description: Category deleted
 *       '400':
 *         description: Cannot delete category with children
 *       '401':
 *         description: Not authenticated
 *       '403':
 *         description: Insufficient permissions
 *       '404':
 *         description: Category not found
 */
router.delete(
  '/:id',
  authenticate,
  authorize(Role.Administrator),
  categoryController.remove,
);

export default router;
