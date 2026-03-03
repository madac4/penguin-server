import jwt, { type SignOptions } from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt.config';

export interface JwtPayload {
  userId: string;
  role: string;
}

export function signAccessToken(payload: JwtPayload): string {
  const options: SignOptions = { expiresIn: jwtConfig.accessExpiresIn as SignOptions['expiresIn'] };
  return jwt.sign(payload, jwtConfig.accessSecret, options);
}

export function signRefreshToken(payload: JwtPayload): string {
  const options: SignOptions = {
    expiresIn: jwtConfig.refreshExpiresIn as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, jwtConfig.refreshSecret, options);
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, jwtConfig.accessSecret) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, jwtConfig.refreshSecret) as JwtPayload;
}
