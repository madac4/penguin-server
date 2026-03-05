import { Router } from 'express'
import * as uploadController from '../../../controllers/upload.controller'
import { authenticate } from '../../../middlewares/auth.middleware'
import { authorize } from '../../../middlewares/role.middleware'
import {
	uploadDocument,
	uploadImage,
	uploadImages,
	uploadModel,
} from '../../../middlewares/upload.middleware'
import { Role } from '../../../utils/enums'

const router = Router()

// All upload routes require authentication + admin role
router.use(authenticate, authorize(Role.Administrator))

// ─── Upload Routes ───────────────────────────────────────────────────────────

/**
 * @openapi
 * /api/v1/uploads/image:
 *   post:
 *     tags:
 *       - Uploads
 *     summary: Upload a single image
 *     description: Uploads a single image file (jpg, png, webp, avif). Max 10 MB. Requires Administrator role.
 *     operationId: uploadImage
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: folder
 *         required: true
 *         description: Storage folder (must match UploadFolder enum)
 *         schema:
 *           type: string
 *           enum: [categories, users]
 *       - in: query
 *         name: oldUrl
 *         required: false
 *         description: Optional old URL for cleanup
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       '200':
 *         description: Image uploaded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Image uploaded successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                       example: https://example.com/categories/a1b2c3d4-e5f6-7890.webp
 *       '400':
 *         description: Invalid file type, folder, or no file provided
 *       '401':
 *         description: Not authenticated
 *       '403':
 *         description: Insufficient permissions
 */
router.post('/image', uploadImage, uploadController.uploadImage)

/**
 * @openapi
 * /api/v1/uploads/images:
 *   post:
 *     tags:
 *       - Uploads
 *     summary: Upload multiple images
 *     description: Uploads up to 10 image files (jpg, png, webp, avif). Max 10 MB each. Requires Administrator role.
 *     operationId: uploadImages
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: folder
 *         required: true
 *         description: Storage folder (must match UploadFolder enum)
 *         schema:
 *           type: string
 *           enum: [categories, users]
 *       - in: query
 *         name: oldUrl
 *         required: false
 *         description: Optional old URL for cleanup
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - files
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       '200':
 *         description: Images uploaded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Images uploaded successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     urls:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["https://example.com/categories/a1b2c3d4-e5f6-7890.webp", "https://example.com/categories/b2c3d4e5-f6a7-8901.webp"]
 *       '400':
 *         description: Invalid file type, folder, or no files provided
 */
router.post('/images', uploadImages, uploadController.uploadImages)

/**
 * @openapi
 * /api/v1/uploads/document:
 *   post:
 *     tags:
 *       - Uploads
 *     summary: Upload a PDF document
 *     description: Uploads a single PDF file. Max 25 MB. Requires Administrator role.
 *     operationId: uploadDocument
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: folder
 *         required: true
 *         description: Storage folder (must match UploadFolder enum)
 *         schema:
 *           type: string
 *           enum: [categories, users]
 *       - in: query
 *         name: oldUrl
 *         required: false
 *         description: Optional old URL for cleanup
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       '200':
 *         description: Document uploaded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Document uploaded successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                       example: https://example.com/categories/a1b2c3d4-e5f6-7890.pdf
 *       '400':
 *         description: Invalid file type, folder, or no file provided
 */
router.post('/document', uploadDocument, uploadController.uploadDocument)

/**
 * @openapi
 * /api/v1/uploads/model:
 *   post:
 *     tags:
 *       - Uploads
 *     summary: Upload a 3D model file
 *     description: Uploads a single 3D model file (.glb, .gltf, .obj, .fbx). Max 100 MB. Requires Administrator role.
 *     operationId: uploadModel
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: folder
 *         required: true
 *         description: Storage folder (must match UploadFolder enum)
 *         schema:
 *           type: string
 *           enum: [categories, users]
 *       - in: query
 *         name: oldUrl
 *         required: false
 *         description: Optional old URL for cleanup
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       '200':
 *         description: Model uploaded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Model uploaded successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                       example: https://example.com/categories/a1b2c3d4-e5f6-7890.glb
 *       '400':
 *         description: Invalid file type, folder, or no file provided
 */
router.post('/model', uploadModel, uploadController.uploadModel)

// ─── Delete ──────────────────────────────────────────────────────────────────

/**
 * @openapi
 * /api/v1/uploads:
 *   delete:
 *     tags:
 *       - Uploads
 *     summary: Delete a file
 *     description: Deletes a file from storage by its URL. Requires Administrator role.
 *     operationId: deleteUpload
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - url
 *             properties:
 *               url:
 *                 type: string
 *                 description: The public URL of the file to delete
 *     responses:
 *       '200':
 *         description: File deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: File deleted successfully
 *                 data:
 *                   type: object
 *                   example: null
 *       '400':
 *         description: Invalid URL
 */
router.delete('/', uploadController.deleteFile)

export default router
