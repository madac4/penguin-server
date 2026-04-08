import { PASSWORD_MIN_LENGTH } from '@/utils/constants'
import { z } from 'zod'
import { Role } from '../utils/enums'

// ─── List / Search Query ─────────────────────────────────────────────────────

export const listUsersSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  search: z.string().trim().optional(),
  role: z.nativeEnum(Role).optional(),
  isBlocked: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
})

export type ListUsersInput = z.infer<typeof listUsersSchema>

// ─── Update User ─────────────────────────────────────────────────────────────

export const updateUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required').trim().optional(),
  lastName: z.string().min(1, 'Last name is required').trim().optional(),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Username can only contain letters, numbers, hyphens, and underscores',
    )
    .toLowerCase()
    .trim()
    .optional(),
  role: z.nativeEnum(Role).optional(),
})

export type UpdateUserInput = z.infer<typeof updateUserSchema>

// ─── Change User Password ────────────────────────────────────────────────────

export const changeUserPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`),
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Passwords do not match',
    path: ['confirmNewPassword'],
  })

export type ChangeUserPasswordInput = z.infer<typeof changeUserPasswordSchema>
