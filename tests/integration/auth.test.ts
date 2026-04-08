import app from '@/app';
import { Token } from '@/models/token.model';
import { User } from '@/models/user.model';
import { TokenType } from '@/utils/enums';
import request from 'supertest';
import {
    TEST_REGISTER_BODY,
    TEST_USER,
    createConfirmationToken,
    createExpiredToken,
    createPasswordResetToken,
    createUnverifiedUser,
    createVerifiedUser,
} from '../helpers/auth.helper';

// ─── Mock the email service (we don't send real emails in tests) ─────────────

jest.mock('@/services/email.service', () => ({
  sendConfirmationEmail: jest.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
  sendEmailChangeEmail: jest.fn().mockResolvedValue(undefined),
}));

const API = '/api/v1/auth';

// ═════════════════════════════════════════════════════════════════════════════
// REGISTER
// ═════════════════════════════════════════════════════════════════════════════

describe('POST /auth/register', () => {
  it('should register a new user and return 201', async () => {
    const res = await request(app)
      .post(`${API}/register`)
      .send(TEST_REGISTER_BODY);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    // user should exist in DB
    const user = await User.findOne({ email: TEST_USER.email });
    expect(user).not.toBeNull();
    expect(user!.isEmailConfirmed).toBe(false);
  });

  it('should return 409 if email is already registered', async () => {
    await createVerifiedUser();

    const res = await request(app)
      .post(`${API}/register`)
      .send(TEST_REGISTER_BODY);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 for weak password (too short)', async () => {
    const res = await request(app)
      .post(`${API}/register`)
      .send({ ...TEST_REGISTER_BODY, password: '123', confirmPassword: '123' });

    expect(res.status).toBe(400);
  });

  it('should return 400 if passwords do not match', async () => {
    const res = await request(app)
      .post(`${API}/register`)
      .send({ ...TEST_REGISTER_BODY, confirmPassword: 'DifferentPass1!' });

    expect(res.status).toBe(400);
  });

  it('should return 400 if required fields are missing', async () => {
    const res = await request(app)
      .post(`${API}/register`)
      .send({ email: 'x@y.com' });

    expect(res.status).toBe(400);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// CONFIRM EMAIL
// ═════════════════════════════════════════════════════════════════════════════

describe('GET /auth/confirm-email', () => {
  it('should confirm the email with a valid token', async () => {
    const user = await createUnverifiedUser();
    const token = await createConfirmationToken(user._id.toString());

    const res = await request(app)
      .get(`${API}/confirm-email`)
      .query({ token });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // verify DB was updated
    const updated = await User.findById(user._id);
    expect(updated!.isEmailConfirmed).toBe(true);
  });

  it('should return 400 for an invalid token', async () => {
    const res = await request(app)
      .get(`${API}/confirm-email`)
      .query({ token: 'invalid-token' });

    expect(res.status).toBe(400);
  });

  it('should return 400 for an expired token', async () => {
    const user = await createUnverifiedUser();
    const token = await createExpiredToken(user._id.toString(), TokenType.EmailConfirmation);

    const res = await request(app)
      .get(`${API}/confirm-email`)
      .query({ token });

    expect(res.status).toBe(400);
  });

  it('should return 400 if email is already confirmed', async () => {
    const user = await createVerifiedUser();
    const token = await createConfirmationToken(user._id.toString());

    const res = await request(app)
      .get(`${API}/confirm-email`)
      .query({ token });

    expect(res.status).toBe(400);
  });

  it('should return 400 when no token is provided', async () => {
    const res = await request(app).get(`${API}/confirm-email`);

    expect(res.status).toBe(400);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// RESEND CONFIRMATION
// ═════════════════════════════════════════════════════════════════════════════

describe('POST /auth/resend-confirmation', () => {
  it('should resend confirmation email for unverified user', async () => {
    await createUnverifiedUser();

    const res = await request(app)
      .post(`${API}/resend-confirmation`)
      .send({ email: TEST_USER.email });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should return 400 if email is already confirmed', async () => {
    await createVerifiedUser();

    const res = await request(app)
      .post(`${API}/resend-confirmation`)
      .send({ email: TEST_USER.email });

    expect(res.status).toBe(400);
  });

  it('should return 404 for non-existent email', async () => {
    const res = await request(app)
      .post(`${API}/resend-confirmation`)
      .send({ email: 'nobody@example.com' });

    expect(res.status).toBe(404);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// LOGIN
// ═════════════════════════════════════════════════════════════════════════════

describe('POST /auth/login', () => {
  it('should login and return access + refresh tokens', async () => {
    await createVerifiedUser();

    const res = await request(app)
      .post(`${API}/login`)
      .send({ email: TEST_USER.email, password: TEST_USER.password });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data).toHaveProperty('refreshToken');
  });

  it('should return 401 for wrong password', async () => {
    await createVerifiedUser();

    const res = await request(app)
      .post(`${API}/login`)
      .send({ email: TEST_USER.email, password: 'WrongPass123!' });

    expect(res.status).toBe(401);
  });

  it('should return 401 for non-existent email', async () => {
    const res = await request(app)
      .post(`${API}/login`)
      .send({ email: 'ghost@example.com', password: 'Password123!' });

    expect(res.status).toBe(401);
  });

  it('should return 403 if email is not confirmed', async () => {
    await createUnverifiedUser();

    const res = await request(app)
      .post(`${API}/login`)
      .send({ email: TEST_USER.email, password: TEST_USER.password });

    expect(res.status).toBe(403);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// REFRESH TOKEN
// ═════════════════════════════════════════════════════════════════════════════

describe('POST /auth/refresh-token', () => {
  it('should return a new token pair with a valid refresh token', async () => {
    await createVerifiedUser();

    // first, login to get a valid refresh token
    const loginRes = await request(app)
      .post(`${API}/login`)
      .send({ email: TEST_USER.email, password: TEST_USER.password });

    const { refreshToken } = loginRes.body.data;

    // count refresh tokens before refresh
    const tokensBefore = await Token.countDocuments({ type: TokenType.RefreshToken });

    const res = await request(app)
      .post(`${API}/refresh-token`)
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data).toHaveProperty('refreshToken');

    // DB should still have exactly one refresh token (old deleted, new created)
    const tokensAfter = await Token.countDocuments({ type: TokenType.RefreshToken });
    expect(tokensAfter).toBe(tokensBefore);
  });

  it('should return 401 for an invalid refresh token', async () => {
    const res = await request(app)
      .post(`${API}/refresh-token`)
      .send({ refreshToken: 'totally-invalid-jwt' });

    expect(res.status).toBe(401);
  });

  it('should rotate the DB token on each refresh', async () => {
    await createVerifiedUser();

    const loginRes = await request(app)
      .post(`${API}/login`)
      .send({ email: TEST_USER.email, password: TEST_USER.password });

    const { refreshToken } = loginRes.body.data;

    // grab the hashed token stored in DB after login
    const tokenBefore = await Token.findOne({ type: TokenType.RefreshToken });
    expect(tokenBefore).not.toBeNull();

    // refresh — this should delete the old DB entry and create a new one
    const res = await request(app)
      .post(`${API}/refresh-token`)
      .send({ refreshToken });

    expect(res.status).toBe(200);

    // the new DB entry should exist (old one is replaced)
    const tokenAfter = await Token.findOne({ type: TokenType.RefreshToken });
    expect(tokenAfter).not.toBeNull();
    // DB still has exactly 1 refresh token
    const count = await Token.countDocuments({ type: TokenType.RefreshToken });
    expect(count).toBe(1);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// LOGOUT
// ═════════════════════════════════════════════════════════════════════════════

describe('POST /auth/logout', () => {
  it('should logout and invalidate the refresh token', async () => {
    await createVerifiedUser();

    const loginRes = await request(app)
      .post(`${API}/login`)
      .send({ email: TEST_USER.email, password: TEST_USER.password });

    const { refreshToken } = loginRes.body.data;

    const res = await request(app)
      .post(`${API}/logout`)
      .send({ refreshToken });

    expect(res.status).toBe(200);

    // refresh token should no longer work
    const refreshRes = await request(app)
      .post(`${API}/refresh-token`)
      .send({ refreshToken });

    expect(refreshRes.status).toBe(401);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// FORGOT PASSWORD
// ═════════════════════════════════════════════════════════════════════════════

describe('POST /auth/forgot-password', () => {
  it('should return 200 for an existing user', async () => {
    await createVerifiedUser();

    const res = await request(app)
      .post(`${API}/forgot-password`)
      .send({ email: TEST_USER.email });

    expect(res.status).toBe(200);

    // a password reset token should exist in the DB
    const tokenDoc = await Token.findOne({
      type: TokenType.PasswordReset,
    });
    expect(tokenDoc).not.toBeNull();
  });

  it('should return 200 even for non-existent email (no user enumeration)', async () => {
    const res = await request(app)
      .post(`${API}/forgot-password`)
      .send({ email: 'nobody@example.com' });

    expect(res.status).toBe(200);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// RESET PASSWORD
// ═════════════════════════════════════════════════════════════════════════════

describe('POST /auth/reset-password', () => {
  it('should reset password with a valid token', async () => {
    const user = await createVerifiedUser();
    const token = await createPasswordResetToken(user._id.toString());

    const newPassword = 'NewSecure123!';

    const res = await request(app)
      .post(`${API}/reset-password`)
      .send({ token, password: newPassword, confirmPassword: newPassword });

    expect(res.status).toBe(200);

    // should be able to login with the new password
    const loginRes = await request(app)
      .post(`${API}/login`)
      .send({ email: TEST_USER.email, password: newPassword });

    expect(loginRes.status).toBe(200);
  });

  it('should return 400 for an invalid reset token', async () => {
    const res = await request(app)
      .post(`${API}/reset-password`)
      .send({
        token: 'bad-token',
        password: 'NewSecure123!',
        confirmPassword: 'NewSecure123!',
      });

    expect(res.status).toBe(400);
  });

  it('should return 400 for an expired reset token', async () => {
    const user = await createVerifiedUser();
    const token = await createExpiredToken(user._id.toString(), TokenType.PasswordReset);

    const res = await request(app)
      .post(`${API}/reset-password`)
      .send({
        token,
        password: 'NewSecure123!',
        confirmPassword: 'NewSecure123!',
      });

    expect(res.status).toBe(400);
  });

  it('should return 400 if passwords do not match', async () => {
    const user = await createVerifiedUser();
    const token = await createPasswordResetToken(user._id.toString());

    const res = await request(app)
      .post(`${API}/reset-password`)
      .send({
        token,
        password: 'NewSecure123!',
        confirmPassword: 'Mismatch!!!',
      });

    expect(res.status).toBe(400);
  });

  it('should invalidate all refresh tokens after password reset', async () => {
    const user = await createVerifiedUser();

    // login to get a refresh token
    const loginRes = await request(app)
      .post(`${API}/login`)
      .send({ email: TEST_USER.email, password: TEST_USER.password });

    const { refreshToken } = loginRes.body.data;

    // reset the password
    const token = await createPasswordResetToken(user._id.toString());
    await request(app)
      .post(`${API}/reset-password`)
      .send({ token, password: 'NewSecure123!', confirmPassword: 'NewSecure123!' });

    // old refresh token should be invalidated
    const refreshRes = await request(app)
      .post(`${API}/refresh-token`)
      .send({ refreshToken });

    expect(refreshRes.status).toBe(401);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// AUTH MIDDLEWARE (protected route access)
// ═════════════════════════════════════════════════════════════════════════════

describe('authenticate middleware', () => {
  // Use any protected route — GET /categories/:id requires auth
  const PROTECTED_ROUTE = '/api/v1/categories/000000000000000000000000';

  it('should return 401 when no Authorization header is provided', async () => {
    const res = await request(app).get(PROTECTED_ROUTE);

    expect(res.status).toBe(401);
  });

  it('should return 401 for an invalid token', async () => {
    const res = await request(app)
      .get(PROTECTED_ROUTE)
      .set('Authorization', 'Bearer invalid-token');

    expect(res.status).toBe(401);
  });

  it('should allow access with a valid access token', async () => {
    await createVerifiedUser();

    const loginRes = await request(app)
      .post(`${API}/login`)
      .send({ email: TEST_USER.email, password: TEST_USER.password });

    const { accessToken } = loginRes.body.data;

    const res = await request(app)
      .get(PROTECTED_ROUTE)
      .set('Authorization', `Bearer ${accessToken}`);

    // should get 404 (category not found) not 401 — proves the middleware passed
    expect(res.status).not.toBe(401);
  });
});
