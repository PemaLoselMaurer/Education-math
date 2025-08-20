/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import type { Request } from 'express';

function cookieExtractor(req: Request): string | null {
  const cookies: Record<string, unknown> | undefined = (
    req as Request & { cookies?: Record<string, unknown> }
  ).cookies;
  const token =
    cookies && typeof cookies['access_token'] === 'string'
      ? cookies['access_token']
      : null;
  return token;
}

function bearerExtractor(req: Request): string | null {
  const auth = req.headers?.authorization;
  if (typeof auth === 'string') {
    const prefix = 'bearer ';
    if (auth.length > prefix.length && auth.toLowerCase().startsWith(prefix)) {
      const token = auth.slice(prefix.length).trim();
      return token || null;
    }
  }
  return null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: (req: Request) =>
        cookieExtractor(req) ?? bearerExtractor(req),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your_jwt_secret',
    });
  }

  validate(payload: { sub: number; username: string }) {
    return { userId: payload.sub, username: payload.username };
  }
}
