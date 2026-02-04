import jwt from 'jsonwebtoken';
import { StringValue } from 'ms';

export interface JwtDecodedUser {
  userId: string;
  firstName: string;
  lastName: string;
}

export interface RefreshTokenSchema {
  insertedAt?: Date;
  expiresIn: number;
  userId: string;
}

export class AuthService {
  constructor() { }

  static generateToken(
    payload: JwtDecodedUser,
    secretKey = 'secret',
    expiresIn: StringValue | number = '10S'
  ): string {
    const { userId, firstName, lastName } = payload;
    return jwt.sign({ userId, firstName, lastName }, secretKey, {
      expiresIn,
    });
  }

  static decodeToken(
    token: string,
    options: jwt.VerifyOptions = {},
    secretKey = 'secret'
  ): JwtDecodedUser {
    return jwt.verify(token, secretKey, options) as JwtDecodedUser;
  }

  static verifyToken(token: string, secretKey = 'secret'): JwtDecodedUser {
    return jwt.verify(token, secretKey) as JwtDecodedUser;
  }

  static refreshTokenExpired(refreshToken: RefreshTokenSchema): boolean {
    const now = Date.now() / 1000;

    return refreshToken.expiresIn < now;
  }
}
