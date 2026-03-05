import type { Request, Response } from 'express'
import { CatchAsyncErrors } from '../middlewares/error.middleware'
import * as userService from '../services/user.service'
import { success } from '../utils/response.util'
import type {
    ChangeUserPasswordInput,
    ListUsersInput,
    UpdateUserInput,
} from '../validators/user.validator'

export const listUsers = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  const query = req.query as unknown as ListUsersInput
  const result = await userService.listUsers(query)
  success(res, result)
})

export const getUserById = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  const user = await userService.getUserById(req.params.id)
  success(res, user)
})

export const updateUser = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  const input = req.body as UpdateUserInput
  const user = await userService.updateUser(req.params.id, input)
  success(res, user, 200, 'User updated successfully')
})

export const changeUserPassword = CatchAsyncErrors(
  async (req: Request, res: Response): Promise<void> => {
    const input = req.body as ChangeUserPasswordInput
    await userService.changeUserPassword(req.params.id, input)
    success(res, null, 200, 'User password changed successfully')
  },
)

export const toggleBlockUser = CatchAsyncErrors(
  async (req: Request, res: Response): Promise<void> => {
    const user = await userService.toggleBlockUser(req.params.id)
    const message = user.isBlocked
      ? 'User has been blocked'
      : 'User has been unblocked'
    success(res, user, 200, message)
  },
)

export const deleteUser = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  await userService.deleteUser(req.params.id)
  success(res, null, 200, 'User deleted successfully')
})
