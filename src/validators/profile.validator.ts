import { z } from 'zod'

const passwordMinLength = 8;

export const updateProfileSchema = z.object({
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
  firstName: z.string().min(1, 'First name is required').trim().optional(),
  lastName: z.string().min(1, 'Last name is required').trim().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const changeEmailSchema = z.object({
  newEmail: z.email('Invalid email address').toLowerCase().trim(),
});

export type ChangeEmailInput = z.infer<typeof changeEmailSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(passwordMinLength, 'Current password is required'),
    newPassword: z
      .string()
      .min(passwordMinLength, `New password must be at least ${passwordMinLength} characters`),
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Passwords do not match',
    path: ['confirmNewPassword'],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;


export const deleteAccountSchema = z.object({
  currentPassword: z.string().min(passwordMinLength, `Current password must be at least ${passwordMinLength} characters`),
});

export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;
