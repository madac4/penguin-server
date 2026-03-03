import type { IUserDocument } from '../models/user.model';
import { type UserDto, toUserDto } from './user.dto';

export interface TokensDto {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponseDto {
  user: UserDto;
  tokens: TokensDto;
}

export function toLoginResponseDto(user: IUserDocument, tokens: TokensDto): LoginResponseDto {
  return {
    user: toUserDto(user),
    tokens,
  };
}
