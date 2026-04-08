// Mock for @scalar/express-api-reference — this ESM-only package
// cannot be imported in Jest's CJS environment, and is not needed for tests.

import type { RequestHandler } from 'express';

export function apiReference(_options: unknown): RequestHandler {
  return (_req, _res, next) => next();
}
