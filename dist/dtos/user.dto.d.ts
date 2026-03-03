import type { IUserDocument } from '../models/user.model';
import type { Role } from '../utils/enums';
export interface UserDto {
    id: string;
    role: Role;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    createdAt: string;
    updatedAt: string;
}
export declare function toUserDto(user: IUserDocument): UserDto;
//# sourceMappingURL=user.dto.d.ts.map