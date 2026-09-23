import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const scrypt = promisify(scryptCallback);
const COOKIE_NAME = 'bentocare_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

export type AuthUser = {
  id: string;
  username: string;
  displayName: string;
};

type TokenPayload = AuthUser & { version: number; exp: number };

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (secret) return secret;
  // 仅方便本地开发；部署环境必须配置随机且足够长的 AUTH_SECRET。
  if (process.env.NODE_ENV !== 'production') return 'bentocare-local-development-secret-change-me';
  throw new Error('AUTH_SECRET must be configured in production');
}

function base64Url(value: string | Buffer) {
  return Buffer.from(value).toString('base64url');
}

function sign(value: string) {
  return createHmac('sha256', getSecret()).update(value).digest('base64url');
}

export function createSessionToken(user: AuthUser, version: number) {
  const payload: TokenPayload = {
    ...user,
    version,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE,
  };
  const encoded = base64Url(JSON.stringify(payload));
  return `${encoded}.${sign(encoded)}`;
}

function readToken(request: Request) {
  const bearer = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (bearer) return bearer;
  const cookieHeader = request.headers.get('cookie') || '';
  return cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE_NAME}=`))
    ?.slice(COOKIE_NAME.length + 1);
}

export async function getAuthenticatedUser(request: Request): Promise<AuthUser | null> {
  const token = readToken(request);
  if (!token) return null;
  const [encoded, signature, ...extra] = token.split('.');
  if (!encoded || !signature || extra.length || signature.length !== sign(encoded).length) return null;

  const expected = Buffer.from(sign(encoded));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString()) as TokenPayload;
    if (!payload.id || !payload.username || !payload.exp || payload.exp < Date.now() / 1000) return null;
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, username: true, displayName: true, tokenVersion: true },
    });
    if (!user || user.tokenVersion !== payload.version) return null;
    return { id: user.id, username: user.username, displayName: user.displayName };
  } catch {
    return null;
  }
}

export async function requireAuth(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (user) return { user } as const;
  return {
    response: NextResponse.json({ success: false, error: '请先登录', code: 'UNAUTHORIZED' }, { status: 401 }),
  } as const;
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString('hex')}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  const expected = Buffer.from(hash, 'hex');
  return expected.length === derived.length && timingSafeEqual(expected, derived);
}

export function attachSession(response: NextResponse, token: string) {
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });
  return response;
}

export function clearSession(response: NextResponse) {
  response.cookies.set(COOKIE_NAME, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 0, path: '/' });
  return response;
}

export function publicUser(user: AuthUser) {
  return { id: user.id, username: user.username, displayName: user.displayName };
}
