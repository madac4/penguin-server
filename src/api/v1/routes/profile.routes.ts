import { Router } from 'express'
import * as profileController from '../../../controllers/profile.controller'
import { authenticate } from '../../../middlewares/auth.middleware'
import { validateBody } from '../../../middlewares/validate.middleware'
import {
	changeEmailSchema,
	changePasswordSchema,
	deleteAccountSchema,
	updateProfileSchema,
} from '../../../validators/profile.validator'

const router = Router();

/**
 * @openapi
 * /api/v1/profile:
 *   get:
 *     tags:
 *       - Profile
 *     summary: Get current user profile
 *     description: Returns the authenticated user's profile information.
 *     operationId: getProfile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: User profile
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
 *                   example: OK
 *                 data:
 *                   $ref: '#/components/schemas/UserDto'
 *       '401':
 *         description: Not authenticated
 */
router.get('/', authenticate, profileController.getProfile);

/**
 * @openapi
 * /api/v1/profile:
 *   patch:
 *     tags:
 *       - Profile
 *     summary: Update profile
 *     description: Updates the authenticated user's profile fields (username, firstName, lastName). All fields are optional — only provided fields are updated.
 *     operationId: updateProfile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 30
 *                 pattern: '^[a-zA-Z0-9_-]+$'
 *               firstName:
 *                 type: string
 *                 minLength: 1
 *               lastName:
 *                 type: string
 *                 minLength: 1
 *     responses:
 *       '200':
 *         description: Profile updated
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
 *                   example: Profile updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/UserDto'
 *       '401':
 *         description: Not authenticated
 *       '409':
 *         description: Username already taken
 */
router.patch('/', authenticate, validateBody(updateProfileSchema), profileController.updateProfile);

/**
 * @openapi
 * /api/v1/profile/change-email:
 *   post:
 *     tags:
 *       - Profile
 *     summary: Request email change
 *     description: Initiates an email address change. A confirmation link is sent to the new email address (valid for 1 hour).
 *     operationId: changeEmail
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newEmail
 *             properties:
 *               newEmail:
 *                 type: string
 *                 format: email
 *     responses:
 *       '200':
 *         description: Confirmation email sent to new address
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
 *                   example: A confirmation link has been sent to your new email address.
 *       '400':
 *         description: New email is the same as current email
 *       '401':
 *         description: Incorrect password or not authenticated
 *       '409':
 *         description: Email already in use
 */
router.post(
  '/change-email',
  authenticate,
  validateBody(changeEmailSchema),
  profileController.changeEmail,
);

/**
 * @openapi
 * /api/v1/profile/confirm-email-change:
 *   get:
 *     tags:
 *       - Profile
 *     summary: Confirm email change
 *     description: Validates the email change token and updates the user's email address. Token expires after 1 hour.
 *     operationId: confirmEmailChange
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Email updated successfully
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
 *                   example: Email address updated successfully
 *       '400':
 *         description: Invalid or expired token
 *       '409':
 *         description: Email already in use
 */
router.get('/confirm-email-change', authenticate, profileController.confirmEmailChange);

/**
 * @openapi
 * /api/v1/profile/change-password:
 *   post:
 *     tags:
 *       - Profile
 *     summary: Change password
 *     description: Changes the user's password. Requires the current password for verification. All other sessions (refresh tokens) are invalidated after the change.
 *     operationId: changePassword
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *               - confirmNewPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *               confirmNewPassword:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Password changed — all other sessions logged out
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
 *                   example: Password changed — all other sessions logged out
 *       '401':
 *         description: Current password is incorrect or not authenticated
 */
router.post(
  '/change-password',
  authenticate,
  validateBody(changePasswordSchema),
  profileController.changePassword,
);

/**
 * @openapi
 * /api/v1/profile/delete-account:
 *   delete:
 *     tags:
 *       - Profile
 *     summary: Delete account
 *     description: Deletes the user's account. Requires the current password for verification. All data associated with the account will be permanently removed.
 *     operationId: deleteAccount
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Account deleted successfully
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
 *                   example: Account deleted successfully
 *       '401':
 *         description: Current password is incorrect or not authenticated
 */
router.delete(
  '/delete-account',
  authenticate,
  validateBody(deleteAccountSchema),
  profileController.deleteAccount,
);


export default router;
