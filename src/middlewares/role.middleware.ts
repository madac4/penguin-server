import type { NextFunction, Request, Response } from 'express'
import type { Role } from '../utils/enums'
import { ErrorHandler } from './error.middleware'

export function authorize(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new ErrorHandler('Authentication required', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new ErrorHandler('Insufficient permissions', 403));
    }

    next();
  };
}
