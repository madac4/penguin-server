import type { IUserDocument } from '../models/user.model';
import { type UserDto } from './user.dto';
export interface TokensDto {
    accessToken: string;
    refreshToken: string;
}
export interface LoginResponseDto {
    user: UserDto;
    tokens: TokensDto;
}
export declare function toLoginResponseDto(user: IUserDocument, tokens: TokensDto): LoginResponseDto;
//# sourceMappingURL=auth.dto.d.ts.map