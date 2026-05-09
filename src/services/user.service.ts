import { toUserDto, toUserDtoList, UserDto } from '@/dtos/user.dto'
import { SALT_ROUNDS } from '@/utils/constants'
import bcrypt from 'bcryptjs'
import { ErrorHandler } from '../middlewares/error.middleware'
import { Token } from '../models/token.model'
import { User, type IUserDocument } from '../models/user.model'
import { TokenType } from '../utils/enums'
import type {
	ChangeUserPasswordInput,
	ListUsersInput,
	UpdateUserInput,
} from '../validators/user.validator'

interface PaginatedUsers {
  users: UserDto[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export async function listUsers(query: ListUsersInput): Promise<PaginatedUsers> {
  const { page, limit, search, role, isBlocked } = query

  const filter: Record<string, any> = {}

  if (search) {
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const searchRegex = new RegExp(escapedSearch, 'i')
    filter.$or = [
      { email: searchRegex },
      { firstName: searchRegex },
      { lastName: searchRegex },
    ]
  }

  if (role) filter.role = role
  if (isBlocked !== undefined) filter.isBlocked = isBlocked

  const skip = (page - 1) * limit

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ])

  return {
    users: toUserDtoList(users),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

export async function getUserById(id: string): Promise<UserDto> {
  const user = await User.findById(id)
  if (!user) throw new ErrorHandler('User not found', 404)
  return toUserDto(user)
}

export async function updateUser(id: string, input: UpdateUserInput): Promise<UserDto> {
  const user = await User.findById(id)
  if (!user) throw new ErrorHandler('User not found', 404)

  if (input.username !== undefined) {
    if (input.username !== null) {
      const existing = await User.findOne({ username: input.username, _id: { $ne: id } })
      if (existing) throw new ErrorHandler('Username is already taken', 409)
    }
    user.username = input.username
  }

  if (input.firstName !== undefined) user.firstName = input.firstName
  if (input.lastName !== undefined) user.lastName = input.lastName
  if (input.role !== undefined) user.role = input.role

  await user.save()
  return toUserDto(user)
}

export async function changeUserPassword(
  id: string,
  input: ChangeUserPasswordInput,
): Promise<void> {
  const user = await User.findById(id)
  if (!user) throw new ErrorHandler('User not found', 404)

  user.password = await bcrypt.hash(input.newPassword, SALT_ROUNDS)
  await user.save()

  await Token.deleteMany({ userId: user._id, type: TokenType.RefreshToken })
}

export async function toggleBlockUser(id: string): Promise<UserDto> {
  const user = await User.findById(id)
  if (!user) throw new ErrorHandler('User not found', 404)

  user.isBlocked = !user.isBlocked
  await user.save()

  if (user.isBlocked) {
    await Token.deleteMany({ userId: user._id, type: TokenType.RefreshToken })
  }

  return toUserDto(user)
}

export async function deleteUser(id: string): Promise<void> {
  const user = await User.findById(id)

  if (!user) throw new ErrorHandler('User not found', 404)

  await Token.deleteMany({ userId: user._id })

  await user.deleteOne()
}
