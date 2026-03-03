"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.confirmEmail = confirmEmail;
exports.resendConfirmationEmail = resendConfirmationEmail;
exports.login = login;
exports.refreshTokens = refreshTokens;
exports.logout = logout;
exports.forgotPassword = forgotPassword;
exports.resetPassword = resetPassword;
const constants_1 = require("../utils/constants");
const bcrypt_1 = __importDefault(require("bcrypt"));
const error_middleware_1 = require("../middlewares/error.middleware");
const token_model_1 = require("../models/token.model");
const user_model_1 = require("../models/user.model");
const enums_1 = require("../utils/enums");
const jwt_util_1 = require("../utils/jwt.util");
const token_util_1 = require("../utils/token.util");
const email_service_1 = require("./email.service");
async function register(input) {
    const existingEmail = await user_model_1.User.findOne({ email: input.email });
    if (existingEmail)
        throw new error_middleware_1.ErrorHandler('Email already registered', 409);
    const hashedPassword = await bcrypt_1.default.hash(input.password, constants_1.SALT_ROUNDS);
    const user = await user_model_1.User.create({
        firstName: input.firstName,
        lastName: input.lastName,
        password: hashedPassword,
        email: input.email,
        isEmailConfirmed: false,
    });
    const { token, hashedToken, expiresAt } = (0, token_util_1.generateConfirmationToken)();
    await token_model_1.Token.create({
        userId: user._id,
        type: enums_1.TokenType.EmailConfirmation,
        token: hashedToken,
        expiresAt,
    });
    await (0, email_service_1.sendConfirmationEmail)(input.email, token, input.firstName);
}
async function confirmEmail(rawToken) {
    const hashedToken = (0, token_util_1.hashToken)(rawToken);
    const tokenDoc = await token_model_1.Token.findOne({
        token: hashedToken,
        type: enums_1.TokenType.EmailConfirmation,
        expiresAt: { $gt: new Date() },
    });
    if (!tokenDoc)
        throw new error_middleware_1.ErrorHandler('Invalid or expired confirmation token', 400);
    const user = await user_model_1.User.findById(tokenDoc.userId);
    if (!user)
        throw new error_middleware_1.ErrorHandler('User not found', 404);
    if (user.isEmailConfirmed)
        throw new error_middleware_1.ErrorHandler('Email is already confirmed', 400);
    user.isEmailConfirmed = true;
    await user.save();
    await token_model_1.Token.deleteMany({ userId: user._id, type: enums_1.TokenType.EmailConfirmation });
}
async function resendConfirmationEmail(email) {
    const user = await user_model_1.User.findOne({ email });
    if (!user)
        throw new error_middleware_1.ErrorHandler('User not found', 404);
    if (user.isEmailConfirmed)
        throw new error_middleware_1.ErrorHandler('Email is already confirmed', 400);
    const { token, hashedToken, expiresAt } = (0, token_util_1.generateConfirmationToken)();
    await token_model_1.Token.create({
        userId: user._id,
        type: enums_1.TokenType.EmailConfirmation,
        token: hashedToken,
        expiresAt,
    });
    await (0, email_service_1.sendConfirmationEmail)(email, token, user.firstName);
}
async function generateTokenPair(user) {
    const payload = { userId: user._id.toString(), role: user.role };
    const accessToken = (0, jwt_util_1.signAccessToken)(payload);
    const refreshToken = (0, jwt_util_1.signRefreshToken)(payload);
    const hashedRefresh = (0, token_util_1.hashToken)(refreshToken);
    await token_model_1.Token.deleteMany({ userId: user._id, type: enums_1.TokenType.RefreshToken });
    await token_model_1.Token.create({
        userId: user._id,
        type: enums_1.TokenType.RefreshToken,
        token: hashedRefresh,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30d
    });
    return { accessToken, refreshToken };
}
async function login(input) {
    const user = await user_model_1.User.findOne({ email: input.email }).select('+password');
    if (!user) {
        throw new error_middleware_1.ErrorHandler('Invalid email or password', 401);
    }
    const isPasswordValid = await bcrypt_1.default.compare(input.password, user.password);
    if (!isPasswordValid) {
        throw new error_middleware_1.ErrorHandler('Invalid email or password', 401);
    }
    if (!user.isEmailConfirmed) {
        throw new error_middleware_1.ErrorHandler('Please confirm your email before logging in', 403);
    }
    const tokens = await generateTokenPair(user);
    return { user, tokens };
}
async function refreshTokens(refreshToken) {
    let payload;
    try {
        payload = (0, jwt_util_1.verifyRefreshToken)(refreshToken);
    }
    catch {
        throw new error_middleware_1.ErrorHandler('Invalid or expired refresh token', 401);
    }
    const hashedRefresh = (0, token_util_1.hashToken)(refreshToken);
    const tokenDoc = await token_model_1.Token.findOne({
        token: hashedRefresh,
        type: enums_1.TokenType.RefreshToken,
        userId: payload.userId,
        expiresAt: { $gt: new Date() },
    });
    if (!tokenDoc) {
        throw new error_middleware_1.ErrorHandler('Refresh token not found or expired', 401);
    }
    const user = await user_model_1.User.findById(payload.userId);
    if (!user) {
        throw new error_middleware_1.ErrorHandler('User not found', 404);
    }
    const tokens = await generateTokenPair(user);
    return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
}
async function logout(refreshToken) {
    const hashedRefresh = (0, token_util_1.hashToken)(refreshToken);
    await token_model_1.Token.deleteOne({ token: hashedRefresh, type: enums_1.TokenType.RefreshToken });
}
// ─── Forgot / Reset Password ─────────────────────────────────────────────────
async function forgotPassword(email) {
    const user = await user_model_1.User.findOne({ email });
    if (!user)
        return;
    await token_model_1.Token.deleteMany({ userId: user._id, type: enums_1.TokenType.PasswordReset });
    const { token, hashedToken, expiresAt } = (0, token_util_1.generateConfirmationToken)();
    await token_model_1.Token.create({
        userId: user._id,
        type: enums_1.TokenType.PasswordReset,
        token: hashedToken,
        expiresAt,
    });
    await (0, email_service_1.sendPasswordResetEmail)(email, token, user.firstName);
}
async function resetPassword(input) {
    const hashedToken = (0, token_util_1.hashToken)(input.token);
    const tokenDoc = await token_model_1.Token.findOne({
        token: hashedToken,
        type: enums_1.TokenType.PasswordReset,
        expiresAt: { $gt: new Date() },
    });
    if (!tokenDoc) {
        throw new error_middleware_1.ErrorHandler('Invalid or expired reset token', 400);
    }
    const user = await user_model_1.User.findById(tokenDoc.userId).select('+password');
    if (!user) {
        throw new error_middleware_1.ErrorHandler('User not found', 404);
    }
    user.password = await bcrypt_1.default.hash(input.password, constants_1.SALT_ROUNDS);
    await user.save();
    await token_model_1.Token.deleteMany({ userId: user._id, type: enums_1.TokenType.PasswordReset });
    await token_model_1.Token.deleteMany({ userId: user._id, type: enums_1.TokenType.RefreshToken });
}
//# sourceMappingURL=auth.service.js.map