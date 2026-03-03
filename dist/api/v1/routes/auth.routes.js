"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController = __importStar(require("../../../controllers/auth.controller"));
const validate_middleware_1 = require("../../../middlewares/validate.middleware");
const auth_validator_1 = require("../../../validators/auth.validator");
const router = (0, express_1.Router)();
/**
 * @openapi
 * /api/v1/auth/register:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Register a new user
 *     description: Creates a new user and sends a confirmation email with a token valid for 1 hour.
 *     operationId: register
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - confirmPassword
 *               - firstName
 *               - lastName
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               confirmPassword:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *     responses:
 *       '201':
 *         description: User created — confirmation email sent
 *       '400':
 *         description: Validation failed
 *       '409':
 *         description: Email already registered
 */
router.post('/register', (0, validate_middleware_1.validateBody)(auth_validator_1.registerSchema), authController.register);
/**
 * @openapi
 * /api/v1/auth/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Login
 *     description: Authenticates a user with email and password. Returns access token (short-lived) and refresh token (long-lived). Email must be confirmed before login.
 *     operationId: login
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: secret123
 *     responses:
 *       '200':
 *         description: Login successful
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
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/UserDto'
 *                     tokens:
 *                       type: object
 *                       properties:
 *                         accessToken:
 *                           type: string
 *                         refreshToken:
 *                           type: string
 *       '401':
 *         description: Invalid email or password
 *       '403':
 *         description: Email not confirmed
 */
router.post('/login', (0, validate_middleware_1.validateBody)(auth_validator_1.loginSchema), authController.login);
/**
 * @openapi
 * /api/v1/auth/refresh-token:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Refresh access token
 *     description: Exchanges a valid refresh token for a new access token and refresh token pair. The old refresh token is invalidated.
 *     operationId: refreshToken
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Tokens refreshed
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
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/UserDto'
 *                     tokens:
 *                       type: object
 *                       properties:
 *                         accessToken:
 *                           type: string
 *                         refreshToken:
 *                           type: string
 *       '401':
 *         description: Invalid or expired refresh token
 */
router.post('/refresh-token', (0, validate_middleware_1.validateBody)(auth_validator_1.refreshTokenSchema), authController.refreshToken);
/**
 * @openapi
 * /api/v1/auth/logout:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Logout
 *     description: Invalidates the provided refresh token. The access token remains valid until it expires.
 *     operationId: logout
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Logged out successfully
 */
router.post('/logout', (0, validate_middleware_1.validateBody)(auth_validator_1.refreshTokenSchema), authController.logout);
/**
 * @openapi
 * /api/v1/auth/forgot-password:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Forgot password
 *     description: Sends a password reset email with a token valid for 1 hour. Always returns 200 regardless of whether the email exists (to prevent user enumeration).
 *     operationId: forgotPassword
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       '200':
 *         description: If the email exists, a reset link has been sent
 */
router.post('/forgot-password', (0, validate_middleware_1.validateBody)(auth_validator_1.forgotPasswordSchema), authController.forgotPassword);
/**
 * @openapi
 * /api/v1/auth/reset-password:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Reset password
 *     description: Resets the user's password using the token from the forgot password email. Invalidates all existing refresh tokens (logs out all sessions).
 *     operationId: resetPassword
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *               - confirmPassword
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *                 minLength: 8
 *               confirmPassword:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Password reset successfully
 *       '400':
 *         description: Invalid or expired token, or passwords don't match
 */
router.post('/reset-password', (0, validate_middleware_1.validateBody)(auth_validator_1.resetPasswordSchema), authController.resetPassword);
/**
 * @openapi
 * /api/v1/auth/confirm-email:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Confirm email address
 *     description: Validates the confirmation token and marks the user's email as confirmed. Token expires after 1 hour.
 *     operationId: confirmEmail
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Email confirmed
 *       '400':
 *         description: Invalid or expired token
 */
router.get('/confirm-email', authController.confirmEmail);
/**
 * @openapi
 * /api/v1/auth/resend-confirmation:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Resend confirmation email
 *     description: Generates a new confirmation token (1 hour expiry) and sends a new confirmation email.
 *     operationId: resendConfirmationEmail
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       '200':
 *         description: Confirmation email resent
 *       '400':
 *         description: Email is already confirmed
 *       '404':
 *         description: User not found
 */
router.post('/resend-confirmation', (0, validate_middleware_1.validateBody)(auth_validator_1.resendConfirmationSchema), authController.resendConfirmationEmail);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map