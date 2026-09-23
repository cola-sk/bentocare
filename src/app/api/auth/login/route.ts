import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { attachSession, createSessionToken, publicUser, verifyPassword } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const username = String(body.username || '').trim().toLowerCase();
    const password = String(body.password || '');
    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true, username: true, displayName: true, passwordHash: true, tokenVersion: true },
    });
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json({ success: false, error: '用户名或密码不正确' }, { status: 401 });
    }
    const publicProfile = publicUser(user);
    const result = NextResponse.json({ success: true, data: publicProfile });
    return attachSession(result, createSessionToken(publicProfile, user.tokenVersion));
  } catch {
    return NextResponse.json({ success: false, error: '登录失败，请稍后重试' }, { status: 500 });
  }
}
