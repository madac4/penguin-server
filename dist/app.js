"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_api_reference_1 = require("@scalar/express-api-reference");
const cors_1 = __importDefault(require("cors"));
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const index_1 = __importDefault(require("./api/v1/index"));
const openapi_generate_1 = require("./docs/openapi.generate");
const error_middleware_1 = require("./middlewares/error.middleware");
const app = (0, express_1.default)();
// ─── Security & Parsing ───────────────────────────────────────────────────────
app.use((0, helmet_1.default)({ contentSecurityPolicy: false }));
app.use((0, cors_1.default)({
    origin: (process.env.CORS_ORIGINS ?? 'http://localhost:3000').split(',').map((s) => s.trim()),
    credentials: true,
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// ─── Logging ──────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
    app.use((0, morgan_1.default)('dev'));
}
// ─── API Routes ───────────────────────────────────────────────────────────────
const API_PREFIX = process.env.API_PREFIX ?? '/api/v1';
app.use(API_PREFIX, index_1.default);
// ─── OpenAPI Spec endpoint (generated from JSDoc in route files) ──────────────
app.get('/openapi.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send((0, openapi_generate_1.generateOpenApiSpec)());
});
// ─── Scalar API Docs ──────────────────────────────────────────────────────────
app.use('/docs', (0, express_api_reference_1.apiReference)({
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
}));
// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((_req, _res, next) => {
    next(new error_middleware_1.ErrorHandler('Route not found', 404));
});
// ─── Global Error Handler (must be last) ──────────────────────────────────────
app.use(error_middleware_1.globalErrorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map