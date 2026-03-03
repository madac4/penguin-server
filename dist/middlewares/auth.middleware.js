"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const user_model_1 = require("../models/user.model");
const jwt_util_1 = require("../utils/jwt.util");
const error_middleware_1 = require("./error.middleware");
const authenticate = async (req, _res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return next(new error_middleware_1.ErrorHandler('Access token is required', 401));
    }
    const token = authHeader.split(' ')[1];
    try {
        const payload = (0, jwt_util_1.verifyAccessToken)(token);
        const user = await user_model_1.User.findById(payload.userId);
        if (!user)
            return next(new error_middleware_1.ErrorHandler('User not found', 401));
        req.user = user;
        next();
    }
    catch {
        next(new error_middleware_1.ErrorHandler('Invalid or expired access token', 401));
    }
};
exports.authenticate = authenticate;
//# sourceMappingURL=auth.middleware.js.map