import { Router } from 'express'
import * as userController from '../../../controllers/user.controller'
import { authenticate } from '../../../middlewares/auth.middleware'
import { authorize } from '../../../middlewares/role.middleware'
import { validateBody, validateQuery } from '../../../middlewares/validate.middleware'
import { Role } from '../../../utils/enums'
import {
	changeUserPasswordSchema,
	listUsersSchema,
	updateUserSchema,
} from '../../../validators/user.validator'

const router = Router()

// All user management routes require admin access
router.use(authenticate, authorize(Role.Administrator))

/**
 * @openapi
 * /api/v1/users:
 *   get:
 *     tags:
 *       - Users 
 *     summary: List users
 *     description: Returns a paginated list of users. Supports search, filtering, and sorting.
 *     operationId: listUsers
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
 *       - in: query
 *         name: search
 *         description: Search by email, first name, or last name
 *         schema:
 *           type: string
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [Administrator, User]
 *       - in: query
 *         name: isBlocked
 *         schema:
 *           type: boolean
 *     responses:
 *       '200':
 *         description: Paginated users list
 */
router.get('/', validateQuery(listUsersSchema), userController.listUsers)

/**
 * @openapi
 * /api/v1/users/{id}:
 *   get:
 *     tags:
 *       - Users 
 *     summary: Get user details
 *     description: Returns details for a specific user.
 *     operationId: getUserById
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
 *         description: User details
 *       '404':
 *         description: User not found
 */
router.get('/:id', userController.getUserById)

/**
 * @openapi
 * /api/v1/users/{id}:
 *   patch:
 *     tags:
 *       - Users 
 *     summary: Update user
 *     description: Update user fields (first name, last name, username, role).
 *     operationId: updateUser
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
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               username:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [Administrator, User]
 *     responses:
 *       '200':
 *         description: User updated
 *       '404':
 *         description: User not found
 *       '409':
 *         description: Username already taken
 */
router.patch('/:id', validateBody(updateUserSchema), userController.updateUser)

/**
 * @openapi
 * /api/v1/users/{id}/password:
 *   patch:
 *     tags:
 *       - Users 
 *     summary: Change user password
 *     description: Adminly forcefully changes a user's password without needing their old password.
 *     operationId: changeUserPassword
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
 *             required:
 *               - newPassword
 *               - confirmNewPassword
 *             properties:
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *               confirmNewPassword:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Password changed successfully
 *       '404':
 *         description: User not found
 */
router.patch(
  '/:id/password',
  validateBody(changeUserPasswordSchema),
  userController.changeUserPassword,
)

/**
 * @openapi
 * /api/v1/users/{id}/block:
 *   patch:
 *     tags:
 *       - Users 
 *     summary: Toggle block status
 *     description: Toggles a user's `isBlocked` status. When blocked, active sessions are invalidated.
 *     operationId: toggleBlockUser
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
 *         description: User block status toggled
 *       '404':
 *         description: User not found
 */
router.patch('/:id/block', userController.toggleBlockUser)

/**
 * @openapi
 * /api/v1/users/{id}:
 *   delete:
 *     tags:
 *       - Users 
 *     summary: Delete user
 *     description: Permanently deletes a user and associated tokens.
 *     operationId: deleteUser
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
 *         description: User deleted successfully
 *       '404':
 *         description: User not found
 */
router.delete('/:id', userController.deleteUser)

export default router
