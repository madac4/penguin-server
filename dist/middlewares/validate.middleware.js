"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBody = validateBody;
const error_middleware_1 = require("./error.middleware");
function validateBody(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);
        if (result.success) {
            req.body = result.data;
            next();
            return;
        }
        const issues = result.error.flatten();
        const messages = issues.fieldErrors
            ? Object.values(issues.fieldErrors).flat().join(', ')
            : result.error.message;
        next(new error_middleware_1.ErrorHandler(messages, 400));
    };
}
//# sourceMappingURL=validate.middleware.js.map