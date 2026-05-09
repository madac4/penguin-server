import { Router } from 'express';
import * as propertyDefinitionController from '../../../controllers/property-definition.controller';
import { authenticate } from '../../../middlewares/auth.middleware';
import { authorize } from '../../../middlewares/role.middleware';
import { validateBody, validateQuery } from '../../../middlewares/validate.middleware';
import { Role } from '../../../utils/enums';
import {
  createPropertyDefinitionSchema,
  listPropertyDefinitionsSchema,
  updatePropertyDefinitionSchema,
} from '../../../validators/property-definition.validator';

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     PropertyDefinitionDto:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           $ref: '#/components/schemas/TranslatedField'
 *         slug:
 *           $ref: '#/components/schemas/TranslatedField'
 *         categories:
 *           type: array
 *           items:
 *             type: string
 *         values:
 *           type: array
 *           items:
 *             type: string
 *         isActive:
 *           type: boolean
 *         showInListing:
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
 * /api/v1/property-definitions:
 *   get:
 *     tags:
 *       - Property Definitions
 *     summary: Paginated list of property definitions
 *     description: Returns a paginated list of property definitions. Supports bilingual search (en/ru) and filtering by isActive status.
 *     operationId: listPropertyDefinitions
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
 *         description: Search in property names (works in both English and Russian)
 *         schema:
 *           type: string
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: category
 *         description: Return property definitions assigned to this category ID
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Paginated list of property definitions
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
 *                         $ref: '#/components/schemas/PropertyDefinitionDto'
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 */
router.get('/', validateQuery(listPropertyDefinitionsSchema), propertyDefinitionController.list);

/**
 * @openapi
 * /api/v1/property-definitions/{id}:
 *   get:
 *     tags:
 *       - Property Definitions
 *     summary: Get property definition by ID
 *     operationId: getPropertyDefinitionById
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Property definition details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/PropertyDefinitionDto'
 *       '404':
 *         description: Property definition not found
 */
router.get('/:id', propertyDefinitionController.getById);

// ─── Admin Routes ────────────────────────────────────────────────────────────

/**
 * @openapi
 * /api/v1/property-definitions:
 *   post:
 *     tags:
 *       - Property Definitions
 *     summary: Create a property definition
 *     description: Creates a new reusable product property definition with bilingual name. Requires Administrator role.
 *     operationId: createPropertyDefinition
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
 *               categories:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: string
 *                 description: Category IDs this property can be used with
 *               values:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Optional initial values. Product saves keep this list synchronized.
 *               isActive:
 *                 type: boolean
 *                 default: true
 *               showInListing:
 *                 type: boolean
 *                 default: false
 *           example:
 *             name:
 *               en: "Weight"
 *               ru: "Вес"
 *             categories:
 *               - "64abc123abc123abc123abcd"
 *     responses:
 *       '201':
 *         description: Property definition created
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
 *                   $ref: '#/components/schemas/PropertyDefinitionDto'
 *       '400':
 *         description: Validation error
 *       '401':
 *         description: Not authenticated
 *       '403':
 *         description: Insufficient permissions
 *       '409':
 *         description: Property with this name already exists
 */
router.post(
  '/',
  authenticate,
  authorize(Role.Administrator),
  validateBody(createPropertyDefinitionSchema),
  propertyDefinitionController.create,
);

/**
 * @openapi
 * /api/v1/property-definitions/{id}:
 *   put:
 *     tags:
 *       - Property Definitions
 *     summary: Update a property definition
 *     description: Updates an existing property definition. Requires Administrator role. All fields are optional.
 *     operationId: updatePropertyDefinition
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
 *               categories:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: string
 *               values:
 *                 type: array
 *                 items:
 *                   type: string
 *               isActive:
 *                 type: boolean
 *               showInListing:
 *                 type: boolean
 *     responses:
 *       '200':
 *         description: Property definition updated
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
 *                   $ref: '#/components/schemas/PropertyDefinitionDto'
 *       '400':
 *         description: Validation error
 *       '401':
 *         description: Not authenticated
 *       '403':
 *         description: Insufficient permissions
 *       '404':
 *         description: Property definition not found
 */
router.put(
  '/:id',
  authenticate,
  authorize(Role.Administrator),
  validateBody(updatePropertyDefinitionSchema),
  propertyDefinitionController.update,
);

/**
 * @openapi
 * /api/v1/property-definitions/{id}:
 *   delete:
 *     tags:
 *       - Property Definitions
 *     summary: Delete a property definition
 *     description: Deletes a property definition. Requires Administrator role.
 *     operationId: deletePropertyDefinition
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
 *         description: Property definition deleted
 *       '401':
 *         description: Not authenticated
 *       '403':
 *         description: Insufficient permissions
 *       '404':
 *         description: Property definition not found
 */
router.delete(
  '/:id',
  authenticate,
  authorize(Role.Administrator),
  propertyDefinitionController.remove,
);

export default router;
