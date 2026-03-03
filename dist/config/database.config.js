"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.databaseConfig = void 0;
exports.databaseConfig = {
    uri: process.env.DATABASE_URL ?? 'mongodb://localhost:27017/penguin_db',
    options: {
        maxPoolSize: 10,
    },
};
//# sourceMappingURL=database.config.js.map