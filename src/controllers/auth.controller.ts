import type { Request, Response } from 'express';
import { toLoginResponseDto } from '../dtos/auth.dto';
import { CatchAsyncErrors, ErrorHandler } from '../middlewares/error.middleware';
import * as authService from '../services/auth.service';
import { success } from '../utils/response.util';
import type {
  ForgotPasswordInput,
  LoginInput,
  RefreshTokenInput,
  RegisterInput,
  ResetPasswordInput,
} from '../validators/auth.validator';

export const register = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  await authService.register(req.body as RegisterInput);
  success(
    res,
    null,
    201,
    'Registration successful. Please check your email to confirm your account.',
  );
});

export const confirmEmail = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  const { token } = req.query as { token: string };

  if (!token) {
    throw new ErrorHandler('Token is required', 400);
  }

  await authService.confirmEmail(token);
  success(res, null, 200, 'Email confirmed successfully');
});

export const resendConfirmationEmail = CatchAsyncErrors(
  async (req: Request, res: Response): Promise<void> => {
    const { email } = req.body as { email: string };
    await authService.resendConfirmationEmail(email);
    success(res, null, 200, 'Confirmation email sent. Please check your inbox.');
  },
);

export const login = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  const { user, tokens } = await authService.login(req.body as LoginInput);
  success(res, toLoginResponseDto(user, tokens));
});

export const refreshToken = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body as RefreshTokenInput;
  const tokens = await authService.refreshTokens(refreshToken);
  success(res, tokens);
});

export const logout = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body as RefreshTokenInput;
  await authService.logout(refreshToken);
  success(res, null, 200, 'Logged out successfully');
});

export const forgotPassword = CatchAsyncErrors(
  async (req: Request, res: Response): Promise<void> => {
    const { email } = req.body as ForgotPasswordInput;
    await authService.forgotPassword(email);
    success(
      res,
      null,
      200,
      'If an account with that email exists, a password reset link has been sent.',
    );
  },
);

export const resetPassword = CatchAsyncErrors(
  async (req: Request, res: Response): Promise<void> => {
    await authService.resetPassword(req.body as ResetPasswordInput);
    success(
      res,
      null,
      200,
      'Password reset successfully. You can now log in with your new password.',
    );
  },
);
