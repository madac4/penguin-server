import { TokensDto } from '../dtos/auth.dto';
import { type IUserDocument } from '../models/user.model';
import type { LoginInput, RegisterInput, ResetPasswordInput } from '../validators/auth.validator';
export declare function register(input: RegisterInput): Promise<void>;
export declare function confirmEmail(rawToken: string): Promise<void>;
export declare function resendConfirmationEmail(email: string): Promise<void>;
interface TokenPair {
    accessToken: string;
    refreshToken: string;
}
export declare function login(input: LoginInput): Promise<{
    user: IUserDocument;
    tokens: TokenPair;
}>;
export declare function refreshTokens(refreshToken: string): Promise<TokensDto>;
export declare function logout(refreshToken: string): Promise<void>;
export declare function forgotPassword(email: string): Promise<void>;
export declare function resetPassword(input: ResetPasswordInput): Promise<void>;
export {};
//# sourceMappingURL=auth.service.d.ts.map