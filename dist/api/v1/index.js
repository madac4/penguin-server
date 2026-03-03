"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const health_routes_1 = __importDefault(require("./routes/health.routes"));
const v1Router = (0, express_1.Router)();
v1Router.get('/', (_req, res) => {
    res.json({
        success: true,
        message: 'Penguin CMS API v1',
        docs: '/docs',
    });
});
v1Router.use('/auth', auth_routes_1.default);
v1Router.use('/health', health_routes_1.default);
exports.default = v1Router;
//# sourceMappingURL=index.js.map