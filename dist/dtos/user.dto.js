"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toUserDto = toUserDto;
function toUserDto(user) {
    return {
        id: user._id.toString(),
        role: user.role,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
    };
}
//# sourceMappingURL=user.dto.js.map