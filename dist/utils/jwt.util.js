"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signAccessToken = signAccessToken;
exports.signRefreshToken = signRefreshToken;
exports.verifyAccessToken = verifyAccessToken;
exports.verifyRefreshToken = verifyRefreshToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const jwt_config_1 = require("../config/jwt.config");
function signAccessToken(payload) {
    const options = { expiresIn: jwt_config_1.jwtConfig.accessExpiresIn };
    return jsonwebtoken_1.default.sign(payload, jwt_config_1.jwtConfig.accessSecret, options);
}
function signRefreshToken(payload) {
    const options = {
        expiresIn: jwt_config_1.jwtConfig.refreshExpiresIn,
    };
    return jsonwebtoken_1.default.sign(payload, jwt_config_1.jwtConfig.refreshSecret, options);
}
function verifyAccessToken(token) {
    return jsonwebtoken_1.default.verify(token, jwt_config_1.jwtConfig.accessSecret);
}
function verifyRefreshToken(token) {
    return jsonwebtoken_1.default.verify(token, jwt_config_1.jwtConfig.refreshSecret);
}
//# sourceMappingURL=jwt.util.js.map