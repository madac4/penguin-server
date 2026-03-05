import { Token } from '@/models/token.model'
import { User } from '@/models/user.model'
import { SALT_ROUNDS } from '@/utils/constants'
import { TokenType } from '@/utils/enums'
import { hashToken } from '@/utils/token.util'
import bcrypt from 'bcrypt'

// ─── Default Test Data ───────────────────────────────────────────────────────

export const TEST_USER = {
  email: 'john@example.com',
  password: 'Password123!',
  firstName: 'John',
  lastName: 'Doe',
};

export const TEST_REGISTER_BODY = {
  ...TEST_USER,
  confirmPassword: TEST_USER.password,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Creates a user directly in the DB with email already confirmed.
 * Returns the created user document.
 */
export async function createVerifiedUser(overrides: Partial<typeof TEST_USER> = {}) {
  const data = { ...TEST_USER, ...overrides };
  const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

  return User.create({
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    password: hashedPassword,
    isEmailConfirmed: true,
  });
}

/**
 * Creates a user that has NOT confirmed their email yet.
 */
export async function createUnverifiedUser(overrides: Partial<typeof TEST_USER> = {}) {
  const data = { ...TEST_USER, ...overrides };
  const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

  return User.create({
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    password: hashedPassword,
    isEmailConfirmed: false,
  });
}

/**
 * Creates an email confirmation token for a user in the DB.
 * Returns the raw (unhashed) token for use in tests.
 */
export async function createConfirmationToken(userId: string): Promise<string> {
  const rawToken = 'test-confirmation-token-123';
  const hashed = hashToken(rawToken);

  await Token.create({
    userId,
    type: TokenType.EmailConfirmation,
    token: hashed,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
  });

  return rawToken;
}

/**
 * Creates a password reset token for a user in the DB.
 * Returns the raw (unhashed) token for use in tests.
 */
export async function createPasswordResetToken(userId: string): Promise<string> {
  const rawToken = 'test-reset-token-456';
  const hashed = hashToken(rawToken);

  await Token.create({
    userId,
    type: TokenType.PasswordReset,
    token: hashed,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
  });

  return rawToken;
}

/**
 * Creates an expired token of the given type for edge-case tests.
 */
export async function createExpiredToken(
  userId: string,
  type: TokenType,
): Promise<string> {
  const rawToken = 'expired-token-789';
  const hashed = hashToken(rawToken);

  await Token.create({
    userId,
    type,
    token: hashed,
    expiresAt: new Date(Date.now() - 1000), // already expired
  });

  return rawToken;
}
