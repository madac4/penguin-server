"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.refreshTokenSchema = exports.loginSchema = exports.resendConfirmationSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
const passwordMinLength = 8;
exports.registerSchema = zod_1.z
    .object({
    email: zod_1.z.email('Invalid email address').toLowerCase().trim(),
    password: zod_1.z
        .string()
        .min(passwordMinLength, `Password must be at least ${passwordMinLength} characters`),
    confirmPassword: zod_1.z.string(),
    firstName: zod_1.z.string().min(1, 'First name is required').trim(),
    lastName: zod_1.z.string().min(1, 'Last name is required').trim(),
})
    .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
});
exports.resendConfirmationSchema = zod_1.z.object({
    email: zod_1.z.email('Invalid email address').toLowerCase().trim(),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.email('Invalid email address').toLowerCase().trim(),
    password: zod_1.z.string().min(1, 'Password is required'),
});
exports.refreshTokenSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(1, 'Refresh token is required'),
});
exports.forgotPasswordSchema = zod_1.z.object({
    email: zod_1.z.email('Invalid email address').toLowerCase().trim(),
});
exports.resetPasswordSchema = zod_1.z
    .object({
    token: zod_1.z.string().min(1, 'Reset token is required'),
    password: zod_1.z
        .string()
        .min(passwordMinLength, `Password must be at least ${passwordMinLength} characters`),
    confirmPassword: zod_1.z.string(),
})
    .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
});
//# sourceMappingURL=auth.validator.js.map