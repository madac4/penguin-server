import { Router } from 'express'
import * as authController from '../../../controllers/auth.controller'
import { validateBody } from '../../../middlewares/validate.middleware'
import {
	forgotPasswordSchema,
	loginSchema,
	refreshTokenSchema,
	registerSchema,
	resendConfirmationSchema,
	resetPasswordSchema,
} from '../../../validators/auth.validator'

const router = Router();

router.post('/register', validateBody(registerSchema), authController.register);

router.post('/login', validateBody(loginSchema), authController.login);

router.post('/refresh-token', validateBody(refreshTokenSchema), authController.refreshToken);

router.post('/logout', validateBody(refreshTokenSchema), authController.logout);

router.post('/forgot-password', validateBody(forgotPasswordSchema), authController.forgotPassword);

router.post('/reset-password', validateBody(resetPasswordSchema), authController.resetPassword);

router.get('/confirm-email', authController.confirmEmail);

router.post(
  '/resend-confirmation',
  validateBody(resendConfirmationSchema),
  authController.resendConfirmationEmail,
);

export default router;
