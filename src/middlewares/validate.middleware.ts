import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';
import { ErrorHandler } from './error.middleware';

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (result.success) {
      req.body = result.data;
      next();
      return;
    }
    const issues = result.error.flatten();
    const messages = issues.fieldErrors
      ? (Object.values(issues.fieldErrors).flat() as string[]).join(', ')
      : result.error.message;
    next(new ErrorHandler(messages, 400));
  };
}
