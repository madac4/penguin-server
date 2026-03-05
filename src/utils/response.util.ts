import type { Response } from 'express'

export function success<T>(res: Response, data: T, statusCode = 200, message = 'OK'): Response {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

export function error(
  res: Response,
  message: string,
  statusCode = 400,
  errors?: string[],
): Response {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors?.length ? { errors } : {}),
  });
}
