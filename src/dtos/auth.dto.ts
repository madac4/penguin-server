import { type UserDto } from './user.dto';

export interface TokensDto {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponseDto {
  user: UserDto;
  tokens: TokensDto;
}
