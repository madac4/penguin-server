import { TokensDto } from '@/dtos/auth.dto'
import { SALT_ROUNDS } from '@/utils/constants'
import bcrypt from 'bcrypt'
import { ErrorHandler } from '../middlewares/error.middleware'
import { Token } from '../models/token.model'
import { User, type IUserDocument } from '../models/user.model'
import { TokenType } from '../utils/enums'
import {
	signAccessToken,
	signRefreshToken,
	verifyRefreshToken,
	type JwtPayload,
} from '../utils/jwt.util'
import { generateConfirmationToken, hashToken } from '../utils/token.util'
import type { LoginInput, RegisterInput, ResetPasswordInput } from '../validators/auth.validator'
import { sendConfirmationEmail, sendPasswordResetEmail } from './email.service'

export async function register(input: RegisterInput): Promise<void> {
  const existingEmail = await User.findOne({ email: input.email });

  if (existingEmail) throw new ErrorHandler('Email already registered', 409);

  const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);

  const user = await User.create({
    firstName: input.firstName,
    lastName: input.lastName,
    password: hashedPassword,
    email: input.email,
    isEmailConfirmed: false,
  });

  const { token, hashedToken, expiresAt } = generateConfirmationToken();

  await Token.create({
    userId: user._id,
    type: TokenType.EmailConfirmation,
    token: hashedToken,
    expiresAt,
  });

  await sendConfirmationEmail(input.email, token, input.firstName);
}

export async function confirmEmail(rawToken: string): Promise<void> {
  const hashedToken = hashToken(rawToken);

  const tokenDoc = await Token.findOne({
    token: hashedToken,
    type: TokenType.EmailConfirmation,
    expiresAt: { $gt: new Date() },
  });

  if (!tokenDoc) throw new ErrorHandler('Invalid or expired confirmation token', 400);

  const user = await User.findById(tokenDoc.userId);
  if (!user) throw new ErrorHandler('User not found', 404);
  if (user.isEmailConfirmed) throw new ErrorHandler('Email is already confirmed', 400);

  user.isEmailConfirmed = true;
  await user.save();
  await Token.deleteMany({ userId: user._id, type: TokenType.EmailConfirmation });
}

export async function resendConfirmationEmail(email: string): Promise<void> {
  const user = await User.findOne({ email });

  if (!user) throw new ErrorHandler('User not found', 404);

  if (user.isEmailConfirmed) throw new ErrorHandler('Email is already confirmed', 400);

  const { token, hashedToken, expiresAt } = generateConfirmationToken();

  await Token.create({
    userId: user._id,
    type: TokenType.EmailConfirmation,
    token: hashedToken,
    expiresAt,
  });

  await sendConfirmationEmail(email, token, user.firstName);
}

// ─── Login / Token Flow ───────────────────────────────────────────────────────

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

async function generateTokenPair(user: IUserDocument): Promise<TokenPair> {
  const payload: JwtPayload = { userId: user._id.toString(), role: user.role };

  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  const hashedRefresh = hashToken(refreshToken);

  await Token.deleteMany({ userId: user._id, type: TokenType.RefreshToken });

  await Token.create({
    userId: user._id,
    type: TokenType.RefreshToken,
    token: hashedRefresh,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30d
  });

  return { accessToken, refreshToken };
}

export async function login(input: LoginInput): Promise<TokensDto> {
  const user = await User.findOne({ email: input.email }).select('+password');

  if (!user) {
    throw new ErrorHandler('Invalid email or password', 401);
  }

  const isPasswordValid = await bcrypt.compare(input.password, user.password);
  if (!isPasswordValid) {
    throw new ErrorHandler('Invalid email or password', 401);
  }

  if (!user.isEmailConfirmed) {
    throw new ErrorHandler('Please confirm your email before logging in', 403);
  }

  if (user.isBlocked) {
    throw new ErrorHandler('Your account has been blocked', 403);
  }

  const tokens = await generateTokenPair(user);

  return tokens;
}

export async function refreshTokens(refreshToken: string): Promise<TokensDto> {
  let payload: JwtPayload;

  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new ErrorHandler('Invalid or expired refresh token', 401);
  }

  const hashedRefresh = hashToken(refreshToken);

  const tokenDoc = await Token.findOne({
    token: hashedRefresh,
    type: TokenType.RefreshToken,
    userId: payload.userId,
    expiresAt: { $gt: new Date() },
  });

  if (!tokenDoc) {
    throw new ErrorHandler('Refresh token not found or expired', 401);
  }

  const user = await User.findById(payload.userId);
  if (!user) {
    throw new ErrorHandler('User not found', 404);
  }

  if (user.isBlocked) {
    await Token.deleteMany({ userId: user._id, type: TokenType.RefreshToken });
    throw new ErrorHandler('Your account has been blocked', 403);
  }

  const tokens = await generateTokenPair(user);

  return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
}

export async function logout(refreshToken: string): Promise<void> {
  const hashedRefresh = hashToken(refreshToken);
  await Token.deleteOne({ token: hashedRefresh, type: TokenType.RefreshToken });
}

// ─── Forgot / Reset Password ─────────────────────────────────────────────────

export async function forgotPassword(email: string): Promise<void> {
  const user = await User.findOne({ email });
  if (!user) return;

  await Token.deleteMany({ userId: user._id, type: TokenType.PasswordReset });

  const { token, hashedToken, expiresAt } = generateConfirmationToken();

  await Token.create({
    userId: user._id,
    type: TokenType.PasswordReset,
    token: hashedToken,
    expiresAt,
  });

  await sendPasswordResetEmail(email, token, user.firstName);
}

export async function resetPassword(input: ResetPasswordInput): Promise<void> {
  const hashedToken = hashToken(input.token);

  const tokenDoc = await Token.findOne({
    token: hashedToken,
    type: TokenType.PasswordReset,
    expiresAt: { $gt: new Date() },
  });

  if (!tokenDoc) {
    throw new ErrorHandler('Invalid or expired reset token', 400);
  }

  const user = await User.findById(tokenDoc.userId).select('+password');
  if (!user) {
    throw new ErrorHandler('User not found', 404);
  }

  user.password = await bcrypt.hash(input.password, SALT_ROUNDS);
  await user.save();

  await Token.deleteMany({ userId: user._id, type: TokenType.PasswordReset });
  await Token.deleteMany({ userId: user._id, type: TokenType.RefreshToken });
}
