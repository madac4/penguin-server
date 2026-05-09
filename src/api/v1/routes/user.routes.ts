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

router.get('/', validateQuery(listUsersSchema), userController.listUsers)

router.get('/:id', userController.getUserById)

router.patch('/:id', validateBody(updateUserSchema), userController.updateUser)

router.patch(
  '/:id/password',
  validateBody(changeUserPasswordSchema),
  userController.changeUserPassword,
)

router.patch('/:id/block', userController.toggleBlockUser)

router.delete('/:id', userController.deleteUser)

export default router
