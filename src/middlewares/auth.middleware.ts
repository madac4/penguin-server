import type { NextFunction, Request, Response } from 'express';
import { User } from '../models/user.model';
import { verifyAccessToken } from '../utils/jwt.util';
import { ErrorHandler } from './error.middleware';

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next(new ErrorHandler('Access token is required', 401));
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.userId);
    if (!user) return next(new ErrorHandler('User not found', 401));
    req.user = user;
    next();
  } catch {
    next(new ErrorHandler('Invalid or expired access token', 401));
  }
};
