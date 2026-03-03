"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const app_1 = __importDefault(require("./app"));
const connection_1 = require("./database/connection");
const PORT = Number(process.env.PORT ?? 4000);
async function start() {
    await (0, connection_1.connectDatabase)();
    const server = app_1.default.listen(PORT, () => {
        console.log(`\n🐧 Penguin CMS API`);
        console.log(`   ├─ API      →  http://localhost:${PORT}/api/v1`);
        console.log(`   ├─ Docs     →  http://localhost:${PORT}/docs`);
        console.log(`   ├─ OpenAPI  →  http://localhost:${PORT}/openapi.json`);
        console.log(`   └─ Health   →  http://localhost:${PORT}/api/v1/health\n`);
    });
    const shutdown = (signal) => {
        console.log(`\n${signal} received — shutting down gracefully...`);
        server.close(() => {
            console.log('Server closed.');
            process.exit(0);
        });
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
}
start().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
});
//# sourceMappingURL=server.js.map