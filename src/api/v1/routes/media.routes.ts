import type { RequestHandler } from 'express';
import { Router } from 'express';
import multer from 'multer';
import * as mediaController from '../../../controllers/media.controller';
import { authenticate } from '../../../middlewares/auth.middleware';
import { authorize } from '../../../middlewares/role.middleware';
import { validateBody, validateQuery } from '../../../middlewares/validate.middleware';
import { Role } from '../../../utils/enums';
import { getMediaType } from '../../../utils/file.util';
import {
  batchDeleteMediaSchema,
  listMediaSchema,
  updateMediaSchema,
} from '../../../validators/media.validator';

const router = Router();

// ─── Multer setup ────────────────────────────────────────────────────────────

const storage = multer.memoryStorage();

const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  if (getMediaType(file.mimetype, file.originalname)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}`));
  }
};

const uploadSingle = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 },
}).single('file') as unknown as RequestHandler;

const uploadMultiple = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 },
}).array('files', 20) as unknown as RequestHandler;

// All media routes require admin
router.use(authenticate, authorize(Role.Administrator));

/**
 * @openapi
 * components:
 *   schemas:
 *     MediaDto:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         filename:
 *           type: string
 *         url:
 *           type: string
 *         mimeType:
 *           type: string
 *         size:
 *           type: integer
 *           description: File size in bytes
 *         type:
 *           type: string
 *           enum: [image, document, model]
 *         folder:
 *           type: string
 *           enum: [categories, products, general, users, subscriptions, all]
 *         uploadedBy:
 *           type: string
 *         alt:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @openapi
 * /api/v1/media:
 *   get:
 *     tags:
 *       - Media
 *     summary: List media files
 *     description: Returns a paginated list of media files. Supports filtering by folder, file type, date range, and search.
 *     operationId: listMedia
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
 *         name: search
 *         description: Search by filename or alt text
 *         schema:
 *           type: string
 *       - in: query
 *         name: folder
 *         description: Filter by storage folder
 *         schema:
 *           type: string
 *           enum: [categories, products, general, users, subscriptions, all]
 *       - in: query
 *         name: type
 *         description: Filter by media type
 *         schema:
 *           type: string
 *           enum: [image, document, model]
 *       - in: query
 *         name: dateFrom
 *         description: Filter files uploaded after this date (ISO 8601)
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: dateTo
 *         description: Filter files uploaded before this date (ISO 8601)
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       '200':
 *         description: Paginated list of media files
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
 *                         $ref: '#/components/schemas/MediaDto'
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
router.get('/', validateQuery(listMediaSchema), mediaController.list);

/**
 * @openapi
 * /api/v1/media/{id}:
 *   get:
 *     tags:
 *       - Media
 *     summary: Get media by ID
 *     operationId: getMediaById
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
 *         description: Media details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/MediaDto'
 *       '404':
 *         description: Media not found
 */
router.get('/:id', mediaController.getById);

/**
 * @openapi
 * /api/v1/media/upload:
 *   post:
 *     tags:
 *       - Media
 *     summary: Upload a single file
 *     description: Uploads a file to R2 and creates a Media record. File type (image/document/model) is auto-detected from MIME type. Requires Administrator role.
 *     operationId: uploadMedia
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - folder
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               folder:
 *                 type: string
 *                 enum: [categories, products, general, users, subscriptions, all]
 *               alt:
 *                 type: string
 *                 description: Optional alt text / description
 *     responses:
 *       '201':
 *         description: File uploaded
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
 *                   $ref: '#/components/schemas/MediaDto'
 *       '400':
 *         description: No file provided or unsupported file type
 *       '401':
 *         description: Not authenticated
 *       '403':
 *         description: Insufficient permissions
 */
router.post('/upload', uploadSingle, mediaController.upload);

/**
 * @openapi
 * /api/v1/media/upload/batch:
 *   post:
 *     tags:
 *       - Media
 *     summary: Upload multiple files
 *     description: Uploads up to 20 files to R2 and creates Media records for each. Requires Administrator role.
 *     operationId: uploadMediaBatch
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - files
 *               - folder
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               folder:
 *                 type: string
 *                 enum: [categories, products, general, users, subscriptions, all]
 *     responses:
 *       '201':
 *         description: Files uploaded
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
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/MediaDto'
 *       '400':
 *         description: No files provided
 */
router.post('/upload/batch', uploadMultiple, mediaController.uploadBatch);

/**
 * @openapi
 * /api/v1/media/{id}:
 *   put:
 *     tags:
 *       - Media
 *     summary: Update media metadata
 *     description: Updates media metadata (alt text). Requires Administrator role.
 *     operationId: updateMedia
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
 *               filename:
 *                 type: string
 *               alt:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Media updated
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
 *                   $ref: '#/components/schemas/MediaDto'
 *       '404':
 *         description: Media not found
 */
router.put('/:id', validateBody(updateMediaSchema), mediaController.update);

/**
 * @openapi
 * /api/v1/media/{id}:
 *   delete:
 *     tags:
 *       - Media
 *     summary: Delete a media file
 *     description: Deletes a file from R2 storage and removes the Media record. Requires Administrator role.
 *     operationId: deleteMedia
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
 *         description: File deleted
 *       '404':
 *         description: Media not found
 */
router.delete('/:id', mediaController.remove);

/**
 * @openapi
 * /api/v1/media/delete/batch:
 *   post:
 *     tags:
 *       - Media
 *     summary: Batch delete media files
 *     description: Deletes multiple files from R2 storage and removes their Media records. Requires Administrator role.
 *     operationId: batchDeleteMedia
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ids
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of media IDs to delete
 *     responses:
 *       '200':
 *         description: Files deleted
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
 *                     deleted:
 *                       type: integer
 */
router.post('/delete/batch', validateBody(batchDeleteMediaSchema), mediaController.removeBatch);

export default router;
