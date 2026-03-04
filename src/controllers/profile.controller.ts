import type { Request, Response } from 'express';
import { toUserDto } from '../dtos/user.dto';
import { CatchAsyncErrors, ErrorHandler } from '../middlewares/error.middleware';
import * as profileService from '../services/profile.service';
import { success } from '../utils/response.util';
import type { ChangePasswordInput, UpdateProfileInput } from '../validators/profile.validator';

export const getProfile = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  const user = await profileService.getProfile(req.user!._id.toString());
  success(res, toUserDto(user));
});

export const updateProfile = CatchAsyncErrors(
  async (req: Request, res: Response): Promise<void> => {
    const user = await profileService.updateProfile(
      req.user!._id.toString(),
      req.body as UpdateProfileInput,
    );
    success(res, toUserDto(user), 200, 'Profile updated successfully');
  },
);

export const changeEmail = CatchAsyncErrors(async (req: Request, res: Response): Promise<void> => {
  await profileService.requestEmailChange(req.user!._id.toString(), req.body.newEmail);
  success(res, null, 200, 'A confirmation link has been sent to your new email address.');
});

export const confirmEmailChange = CatchAsyncErrors(
  async (req: Request, res: Response): Promise<void> => {
    const { token } = req.query as { token: string };

    if (!token) throw new ErrorHandler('Token is required', 400);

    await profileService.confirmEmailChange(token, req.user!._id.toString());

    success(res, null, 200, 'Email address updated successfully');
  },
);

export const changePassword = CatchAsyncErrors(
  async (req: Request, res: Response): Promise<void> => {
    await profileService.changePassword(req.user!._id.toString(), req.body as ChangePasswordInput);
    success(
      res,
      null,
      200,
      'Password changed successfully. All other sessions have been logged out.',
    );
  },
);
