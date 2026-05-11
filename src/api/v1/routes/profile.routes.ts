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

router.get('/', authenticate, profileController.getProfile);

router.patch('/', authenticate, validateBody(updateProfileSchema), profileController.updateProfile);

router.post(
  '/change-email',
  authenticate,
  validateBody(changeEmailSchema),
  profileController.changeEmail,
);

router.get('/confirm-email-change', authenticate, profileController.confirmEmailChange);

router.post(
  '/change-password',
  authenticate,
  validateBody(changePasswordSchema),
  profileController.changePassword,
);

router.delete(
  '/delete-account',
  authenticate,
  validateBody(deleteAccountSchema),
  profileController.deleteAccount,
);


export default router;
