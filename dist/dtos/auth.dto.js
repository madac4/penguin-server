"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toLoginResponseDto = toLoginResponseDto;
const user_dto_1 = require("./user.dto");
function toLoginResponseDto(user, tokens) {
    return {
        user: (0, user_dto_1.toUserDto)(user),
        tokens,
    };
}
//# sourceMappingURL=auth.dto.js.map