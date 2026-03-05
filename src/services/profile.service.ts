import { SALT_ROUNDS } from '@/utils/constants'
import bcrypt from 'bcrypt'
import { ErrorHandler } from '../middlewares/error.middleware'
import { Token } from '../models/token.model'
import { User, type IUserDocument } from '../models/user.model'
import { TokenType } from '../utils/enums'
import { generateConfirmationToken, hashToken } from '../utils/token.util'
import type { ChangePasswordInput, UpdateProfileInput } from '../validators/profile.validator'
import { sendEmailChangeEmail } from './email.service'

export async function getProfile(userId: string): Promise<IUserDocument> {
  const user = await User.findById(userId);

  if (!user) throw new ErrorHandler('User not found', 404);

  return user;
}

export async function updateProfile(
  userId: string,
  input: UpdateProfileInput,
): Promise<IUserDocument> {
  const user = await User.findById(userId);

  if (!user) throw new ErrorHandler('User not found', 404);

  if (input.username !== undefined) {
    const existing = await User.findOne({ username: input.username, _id: { $ne: userId } });
    if (existing) throw new ErrorHandler('Username is already taken', 409);
    user.username = input.username;
  }

  if (input.firstName !== undefined) user.firstName = input.firstName;
  if (input.lastName !== undefined) user.lastName = input.lastName;

  await user.save();
  return user;
}

export async function requestEmailChange(userId: string, newEmail: string): Promise<void> {
  const user = await User.findById(userId);

  if (!user) throw new ErrorHandler('User not found', 404);

  if (newEmail === user.email) {
    throw new ErrorHandler('New email must be different from your current email', 400);
  }

  const existingUser = await User.findOne({ email: newEmail });
  if (existingUser) throw new ErrorHandler('Email is already in use', 409);

  await Token.deleteMany({ userId: user._id, type: TokenType.EmailChange });

  user.pendingEmail = newEmail;
  await user.save();

  const { token, hashedToken, expiresAt } = generateConfirmationToken();

  await Token.create({
    userId: user._id,
    type: TokenType.EmailChange,
    token: hashedToken,
    expiresAt,
  });

  await sendEmailChangeEmail(newEmail, token, user.firstName);
}

export async function confirmEmailChange(rawToken: string, userId: string): Promise<void> {
  const hashedToken = hashToken(rawToken);

  const tokenDoc = await Token.findOne({
    token: hashedToken,
    type: TokenType.EmailChange,
    expiresAt: { $gt: new Date() },
  });

  if (!tokenDoc) throw new ErrorHandler('Invalid or expired email change token', 400);

  const user = await User.findById(tokenDoc.userId);
  if (!user) throw new ErrorHandler('User not found', 404);

  if (userId.toString() !== tokenDoc.userId.toString())
    throw new ErrorHandler('Invalid token', 400);

  if (!user.pendingEmail) {
    throw new ErrorHandler('No pending email change found', 400);
  }

  const existingUser = await User.findOne({ email: user.pendingEmail });
  if (existingUser) throw new ErrorHandler('Email is already in use', 409);

  user.email = user.pendingEmail;
  user.pendingEmail = undefined;
  await user.save();

  await Token.deleteMany({ userId: user._id, type: TokenType.EmailChange });
}

export async function changePassword(userId: string, input: ChangePasswordInput): Promise<void> {
  const user = await User.findById(userId).select('+password');

  if (!user) throw new ErrorHandler('User not found', 404);

  const isPasswordValid = await bcrypt.compare(input.currentPassword, user.password);
  if (!isPasswordValid) throw new ErrorHandler('Current password is incorrect', 401);

  user.password = await bcrypt.hash(input.newPassword, SALT_ROUNDS);

  await user.save();
  await Token.deleteMany({ userId: user._id, type: TokenType.RefreshToken });
}


export async function deleteAccount(userId: string, password: string): Promise<void> {
  const user = await User.findById(userId).select('+password');

  if (!user) throw new ErrorHandler('User not found', 404);

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) throw new ErrorHandler('Current password is incorrect', 401);

  await user.deleteOne();
}