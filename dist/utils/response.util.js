"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.success = success;
exports.error = error;
function success(res, data, statusCode = 200, message = 'OK') {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
    });
}
function error(res, message, statusCode = 400, errors) {
    return res.status(statusCode).json({
        success: false,
        message,
        ...(errors?.length ? { errors } : {}),
    });
}
//# sourceMappingURL=response.util.js.map