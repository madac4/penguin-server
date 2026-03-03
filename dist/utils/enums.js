"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenType = exports.Role = void 0;
var Role;
(function (Role) {
    Role["Administrator"] = "Administrator";
    Role["User"] = "User";
})(Role || (exports.Role = Role = {}));
var TokenType;
(function (TokenType) {
    TokenType["EmailConfirmation"] = "email_confirmation";
    TokenType["RefreshToken"] = "refresh_token";
    TokenType["PasswordReset"] = "password_reset";
})(TokenType || (exports.TokenType = TokenType = {}));
//# sourceMappingURL=enums.js.map