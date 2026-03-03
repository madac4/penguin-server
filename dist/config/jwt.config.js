"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jwtConfig = void 0;
exports.jwtConfig = {
    accessSecret: process.env.JWT_SECRET ?? 'dev_access_secret',
    accessExpiresIn: process.env.JWT_EXPIRES ?? '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'dev_refresh_secret',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES ?? '30d',
};
//# sourceMappingURL=jwt.config.js.map