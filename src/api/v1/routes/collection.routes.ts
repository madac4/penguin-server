import { Router } from 'express';
import * as collectionController from '../../../controllers/collection.controller';
import { authenticate } from '../../../middlewares/auth.middleware';
import { validateBody, validateQuery } from '../../../middlewares/validate.middleware';
import {
  createCollectionSchema,
  listCollectionsSchema,
  renameCollectionSchema,
} from '../../../validators/collection.validator';

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /api/v1/collections:
 *   get:
 *     tags:
 *       - Collections
 *     summary: List user collections
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20, maximum: 100 }
 *     responses:
 *       '200':
 *         description: Paginated list of collections
 *       '401':
 *         description: Not authenticated
 */
router.get('/', validateQuery(listCollectionsSchema), collectionController.list);

/**
 * @openapi
 * /api/v1/collections:
 *   post:
 *     tags:
 *       - Collections
 *     summary: Create a collection
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 100
 *     responses:
 *       '201':
 *         description: Collection created
 *       '409':
 *         description: Collection name already exists
 */
router.post('/', validateBody(createCollectionSchema), collectionController.create);

/**
 * @openapi
 * /api/v1/collections/{id}:
 *   get:
 *     tags:
 *       - Collections
 *     summary: Get a collection with its products
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       '200':
 *         description: Collection detail with enrolled products
 *       '404':
 *         description: Collection not found
 */
router.get('/:id', collectionController.getById);

/**
 * @openapi
 * /api/v1/collections/{id}:
 *   patch:
 *     tags:
 *       - Collections
 *     summary: Rename a collection
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 100
 *     responses:
 *       '200':
 *         description: Collection renamed
 *       '404':
 *         description: Collection not found
 *       '409':
 *         description: Name already taken
 */
router.patch('/:id', validateBody(renameCollectionSchema), collectionController.rename);

/**
 * @openapi
 * /api/v1/collections/{id}:
 *   delete:
 *     tags:
 *       - Collections
 *     summary: Delete a collection
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       '200':
 *         description: Collection deleted
 *       '404':
 *         description: Collection not found
 */
router.delete('/:id', collectionController.remove);

/**
 * @openapi
 * /api/v1/collections/{id}/items/{productId}:
 *   post:
 *     tags:
 *       - Collections
 *     summary: Add an acquired product to a collection
 *     description: Organizes an already-acquired product into a collection. The product must have been acquired first via POST /products/{id}/acquire. Moving a product into a named collection removes it from Uncategorized.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       '201':
 *         description: Product added to collection
 *       '403':
 *         description: Product not yet acquired
 *       '404':
 *         description: Collection or product not found
 *       '409':
 *         description: Product already in this collection
 */
router.post('/:id/items/:productId', collectionController.addItem);

/**
 * @openapi
 * /api/v1/collections/{id}/items/{productId}:
 *   delete:
 *     tags:
 *       - Collections
 *     summary: Remove a product from a collection
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       '200':
 *         description: Product removed from collection
 *       '404':
 *         description: Collection or product not found
 */
router.delete('/:id/items/:productId', collectionController.removeItem);

export default router;
