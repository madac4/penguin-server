import { Router } from 'express';
import * as downloadController from '../../../controllers/download.controller';
import { authenticate } from '../../../middlewares/auth.middleware';
import { validateQuery } from '../../../middlewares/validate.middleware';
import { listDownloadsSchema } from '../../../validators/collection.validator';

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /api/v1/downloads:
 *   get:
 *     tags:
 *       - Downloads
 *     summary: List downloaded products
 *     description: Returns all products the user has downloaded (their "library").
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
 *         description: Paginated downloads list
 *       '401':
 *         description: Not authenticated
 */
router.get('/', validateQuery(listDownloadsSchema), downloadController.list);

/**
 * @openapi
 * /api/v1/downloads/{productId}/files:
 *   get:
 *     tags:
 *       - Downloads
 *     summary: Get files for an acquired product
 *     description: Returns the file URLs for a product the user has already acquired. Can be called unlimited times — no quota consumed.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       '200':
 *         description: File list returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 files:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       url: { type: string }
 *                       filename: { type: string }
 *                       format: { type: string }
 *                       size: { type: integer }
 *       '403':
 *         description: Product not acquired
 *       '404':
 *         description: Product not found
 */
router.get('/:productId/files', downloadController.getFiles);

export default router;
