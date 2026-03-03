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

export function toUserDto(user: IUserDocument): UserDto {
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
