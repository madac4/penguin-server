"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDatabase = connectDatabase;
exports.disconnectDatabase = disconnectDatabase;
const mongoose_1 = __importDefault(require("mongoose"));
const database_config_1 = require("../config/database.config");
async function connectDatabase() {
    try {
        await mongoose_1.default.connect(database_config_1.databaseConfig.uri, database_config_1.databaseConfig.options);
        console.log('   └─ MongoDB  →  connected');
    }
    catch (error) {
        console.error('MongoDB connection error:', error);
        throw error;
    }
}
async function disconnectDatabase() {
    await mongoose_1.default.disconnect();
    console.log('MongoDB disconnected.');
}
//# sourceMappingURL=connection.js.map