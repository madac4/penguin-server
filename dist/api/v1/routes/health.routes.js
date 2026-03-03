"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
router.get('/', (_req, res) => {
    res.json({
        success: true,
        message: 'OK',
        data: {
            status: 'ok',
            version: process.env.npm_package_version ?? '0.1.0',
            environment: process.env.NODE_ENV ?? 'development',
            uptime: Math.round(process.uptime() * 100) / 100,
            timestamp: new Date().toISOString(),
        },
    });
});
exports.default = router;
//# sourceMappingURL=health.routes.js.map