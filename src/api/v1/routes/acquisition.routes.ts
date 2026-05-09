import { Router } from 'express';
import * as downloadController from '../../../controllers/download.controller';
import { authenticate } from '../../../middlewares/auth.middleware';
import { authorize } from '../../../middlewares/role.middleware';
import { validateQuery } from '../../../middlewares/validate.middleware';
import { Role } from '../../../utils/enums';
import {
  listAcquisitionsSchema,
  listAcquisitionHistorySchema,
} from '../../../validators/collection.validator';

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /api/v1/acquisitions:
 *   get:
 *     tags:
 *       - Acquisitions
 *     summary: List current user's acquired products
 *     description: Returns products the authenticated user has acquired through subscription quota.
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
 *         description: Paginated acquisition history
 *       '401':
 *         description: Not authenticated
 */
router.get('/', validateQuery(listAcquisitionHistorySchema), downloadController.list);

/**
 * @openapi
 * /api/v1/acquisitions/{productId}/files:
 *   get:
 *     tags:
 *       - Acquisitions
 *     summary: Get files for an acquired product
 *     description: Returns file URLs for a product the authenticated user has acquired. Can be called unlimited times and does not consume subscription quota.
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
 *       '403':
 *         description: Product not acquired
 *       '404':
 *         description: Product not found
 */
router.get('/:productId/files', downloadController.getFiles);

/**
 * @openapi
 * /api/v1/acquisitions/admin:
 *   get:
 *     tags:
 *       - Acquisitions
 *     summary: List all acquisitions (Admin)
 *     description: Returns acquisition records across users. Use this for admin reporting and acquired-product history.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20, maximum: 100 }
 *       - in: query
 *         name: userId
 *         schema: { type: string }
 *       - in: query
 *         name: productId
 *         schema: { type: string }
 *       - in: query
 *         name: collectionId
 *         schema: { type: string }
 *     responses:
 *       '200':
 *         description: Paginated acquisition records
 *       '403':
 *         description: Insufficient permissions
 */
router.get(
  '/admin',
  authorize(Role.Administrator),
  validateQuery(listAcquisitionsSchema),
  downloadController.adminList,
);

export default router;
