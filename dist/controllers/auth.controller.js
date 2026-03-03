"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.forgotPassword = exports.logout = exports.refreshToken = exports.login = exports.resendConfirmationEmail = exports.confirmEmail = exports.register = void 0;
const auth_dto_1 = require("../dtos/auth.dto");
const error_middleware_1 = require("../middlewares/error.middleware");
const authService = __importStar(require("../services/auth.service"));
const response_util_1 = require("../utils/response.util");
exports.register = (0, error_middleware_1.CatchAsyncErrors)(async (req, res) => {
    await authService.register(req.body);
    (0, response_util_1.success)(res, null, 201, 'Registration successful. Please check your email to confirm your account.');
});
exports.confirmEmail = (0, error_middleware_1.CatchAsyncErrors)(async (req, res) => {
    const { token } = req.query;
    if (!token) {
        throw new error_middleware_1.ErrorHandler('Token is required', 400);
    }
    await authService.confirmEmail(token);
    (0, response_util_1.success)(res, null, 200, 'Email confirmed successfully');
});
exports.resendConfirmationEmail = (0, error_middleware_1.CatchAsyncErrors)(async (req, res) => {
    const { email } = req.body;
    await authService.resendConfirmationEmail(email);
    (0, response_util_1.success)(res, null, 200, 'Confirmation email sent. Please check your inbox.');
});
exports.login = (0, error_middleware_1.CatchAsyncErrors)(async (req, res) => {
    const { user, tokens } = await authService.login(req.body);
    (0, response_util_1.success)(res, (0, auth_dto_1.toLoginResponseDto)(user, tokens));
});
exports.refreshToken = (0, error_middleware_1.CatchAsyncErrors)(async (req, res) => {
    const { refreshToken } = req.body;
    const tokens = await authService.refreshTokens(refreshToken);
    (0, response_util_1.success)(res, tokens);
});
exports.logout = (0, error_middleware_1.CatchAsyncErrors)(async (req, res) => {
    const { refreshToken } = req.body;
    await authService.logout(refreshToken);
    (0, response_util_1.success)(res, null, 200, 'Logged out successfully');
});
exports.forgotPassword = (0, error_middleware_1.CatchAsyncErrors)(async (req, res) => {
    const { email } = req.body;
    await authService.forgotPassword(email);
    (0, response_util_1.success)(res, null, 200, 'If an account with that email exists, a password reset link has been sent.');
});
exports.resetPassword = (0, error_middleware_1.CatchAsyncErrors)(async (req, res) => {
    await authService.resetPassword(req.body);
    (0, response_util_1.success)(res, null, 200, 'Password reset successfully. You can now log in with your new password.');
});
//# sourceMappingURL=auth.controller.js.map