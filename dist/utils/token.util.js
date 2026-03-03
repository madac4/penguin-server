"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateConfirmationToken = generateConfirmationToken;
exports.hashToken = hashToken;
const crypto_1 = __importDefault(require("crypto"));
const constants_1 = require("./constants");
function generateConfirmationToken() {
    const token = crypto_1.default.randomBytes(constants_1.CONFIRMATION_TOKEN_BYTES).toString('hex');
    const hashedToken = crypto_1.default.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + constants_1.CONFIRMATION_TOKEN_EXPIRY_MS);
    return { token, hashedToken, expiresAt };
}
function hashToken(token) {
    return crypto_1.default.createHash('sha256').update(token).digest('hex');
}
//# sourceMappingURL=token.util.js.map