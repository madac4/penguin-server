import { Router } from 'express';
import * as tagController from '../../../controllers/tag.controller';
import { authenticate } from '../../../middlewares/auth.middleware';
import { authorize } from '../../../middlewares/role.middleware';
import { validateBody, validateQuery } from '../../../middlewares/validate.middleware';
import { Role } from '../../../utils/enums';
import {
  createTagSchema,
  listTagsSchema,
  updateTagSchema,
} from '../../../validators/tag.validator';

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     TagDto:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           $ref: '#/components/schemas/TranslatedField'
 *         slug:
 *           $ref: '#/components/schemas/TranslatedField'
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
 * /api/v1/tags:
 *   get:
 *     tags:
 *       - Tags
 *     summary: Paginated list of tags
 *     description: Returns a paginated list of tags. Supports bilingual search (en/ru) and filtering by isActive status.
 *     operationId: listTags
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
 *         description: Search in tag names (works in both English and Russian)
 *         schema:
 *           type: string
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       '200':
 *         description: Paginated list of tags
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
 *                         $ref: '#/components/schemas/TagDto'
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 */
router.get('/', validateQuery(listTagsSchema), tagController.list);

/**
 * @openapi
 * /api/v1/tags/{id}:
 *   get:
 *     tags:
 *       - Tags
 *     summary: Get tag by ID
 *     operationId: getTagById
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Tag details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/TagDto'
 *       '404':
 *         description: Tag not found
 */
router.get('/:id', tagController.getById);

// ─── Admin Routes ────────────────────────────────────────────────────────────

/**
 * @openapi
 * /api/v1/tags:
 *   post:
 *     tags:
 *       - Tags
 *     summary: Create a tag
 *     description: Creates a new tag with bilingual name. Requires Administrator role.
 *     operationId: createTag
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
 *               isActive:
 *                 type: boolean
 *                 default: true
 *           example:
 *             name:
 *               en: "3D Printing"
 *               ru: "3D Печать"
 *     responses:
 *       '201':
 *         description: Tag created
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
 *                   $ref: '#/components/schemas/TagDto'
 *       '400':
 *         description: Validation error
 *       '401':
 *         description: Not authenticated
 *       '403':
 *         description: Insufficient permissions
 *       '409':
 *         description: Tag with this name already exists
 */
router.post(
  '/',
  authenticate,
  authorize(Role.Administrator),
  validateBody(createTagSchema),
  tagController.create,
);

/**
 * @openapi
 * /api/v1/tags/{id}:
 *   put:
 *     tags:
 *       - Tags
 *     summary: Update a tag
 *     description: Updates an existing tag. Requires Administrator role. All fields are optional.
 *     operationId: updateTag
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
 *               isActive:
 *                 type: boolean
 *     responses:
 *       '200':
 *         description: Tag updated
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
 *                   $ref: '#/components/schemas/TagDto'
 *       '400':
 *         description: Validation error
 *       '401':
 *         description: Not authenticated
 *       '403':
 *         description: Insufficient permissions
 *       '404':
 *         description: Tag not found
 */
router.put(
  '/:id',
  authenticate,
  authorize(Role.Administrator),
  validateBody(updateTagSchema),
  tagController.update,
);

/**
 * @openapi
 * /api/v1/tags/{id}:
 *   delete:
 *     tags:
 *       - Tags
 *     summary: Delete a tag
 *     description: Deletes a tag. Requires Administrator role.
 *     operationId: deleteTag
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
 *         description: Tag deleted
 *       '401':
 *         description: Not authenticated
 *       '403':
 *         description: Insufficient permissions
 *       '404':
 *         description: Tag not found
 */
router.delete('/:id', authenticate, authorize(Role.Administrator), tagController.remove);

export default router;
