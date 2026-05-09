import cors from 'cors';
import 'dotenv/config';
import express, { type RequestHandler } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import v1Router from './api/v1/index';
import { generateOpenApiSpec } from './docs/openapi.generate';
import { ErrorHandler, globalErrorHandler } from './middlewares/error.middleware';

type ScalarApiReferenceModule = {
  apiReference: (options: Record<string, unknown>) => RequestHandler;
};

const app = express();
const scalarApiReferenceSpecifier = require.resolve('@scalar/express-api-reference');
let apiReferenceMiddleware: Promise<RequestHandler> | null = null;

async function getApiReferenceMiddleware(): Promise<RequestHandler> {
  const importScalar = new Function(
    'specifier',
    'return import(specifier)',
  ) as (specifier: string) => Promise<ScalarApiReferenceModule>;

  apiReferenceMiddleware ??= importScalar(scalarApiReferenceSpecifier).then(({ apiReference }) =>
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
      authentication: {
        preferredSecurityScheme: 'bearerAuth',
      },
    }),
  );

  return apiReferenceMiddleware;
}

// ─── Security & Parsing ───────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  cors({
    origin: (process.env.CORS_ORIGINS ?? 'http://localhost:3000').split(',').map((s) => s.trim()),
    credentials: true,
  }),
);
app.use(
  express.json({
    verify: (req: express.Request, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);
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
app.use('/docs', async (req, res, next) => {
  try {
    const middleware = await getApiReferenceMiddleware();
    middleware(req, res, next);
  } catch (error) {
    next(error);
  }
});

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((_req, _res, next) => {
  next(new ErrorHandler('Route not found', 404));
});

// ─── Global Error Handler (must be last) ──────────────────────────────────────
app.use(globalErrorHandler);

export default app;
