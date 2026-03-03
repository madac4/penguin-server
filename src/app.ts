import { apiReference } from '@scalar/express-api-reference';
import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import v1Router from './api/v1/index';
import { generateOpenApiSpec } from './docs/openapi.generate';
import { ErrorHandler, globalErrorHandler } from './middlewares/error.middleware';

const app = express();

// ─── Security & Parsing ───────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  cors({
    origin: (process.env.CORS_ORIGINS ?? 'http://localhost:3000').split(',').map((s) => s.trim()),
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Logging ──────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ─── API Routes ───────────────────────────────────────────────────────────────
const API_PREFIX = process.env.API_PREFIX ?? '/api/v1';
app.use(API_PREFIX, v1Router);

// ─── OpenAPI Spec endpoint (generated from JSDoc in route files) ──────────────
app.get('/openapi.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(generateOpenApiSpec());
});

// ─── Scalar API Docs ──────────────────────────────────────────────────────────
app.use(
  '/docs',
  apiReference({
    spec: { url: '/openapi.json' },
    theme: 'purple',
    layout: 'modern',
    defaultHttpClient: {
      targetKey: 'javascript',
      clientKey: 'fetch',
    },
    metaData: {
      title: 'Penguin CMS — API Reference',
    },
  }),
);

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((_req, _res, next) => {
  next(new ErrorHandler('Route not found', 404));
});

// ─── Global Error Handler (must be last) ──────────────────────────────────────
app.use(globalErrorHandler);

export default app;
