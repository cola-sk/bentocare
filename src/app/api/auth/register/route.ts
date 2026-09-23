import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { attachSession, createSessionToken, hashPassword, publicUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const username = String(body.username || '').trim().toLowerCase();
    const displayName = String(body.displayName || username).trim();
    const password = String(body.password || '');
    if (!/^[a-z0-9_.-]{3,32}$/.test(username)) {
      return NextResponse.json({ success: false, error: '用户名需为 3–32 位字母、数字或 ._-' }, { status: 400 });
    }
    if (password.length < 4) {
      return NextResponse.json({ success: false, error: '密码至少需要 4 位' }, { status: 400 });
    }
    if (!displayName || displayName.length > 40) {
      return NextResponse.json({ success: false, error: '请填写 1–40 个字符的显示名称' }, { status: 400 });
    }

    const user = await prisma.user.create({
      data: { username, displayName, passwordHash: await hashPassword(password) },
      select: { id: true, username: true, displayName: true, tokenVersion: true },
    });
    const result = NextResponse.json({ success: true, data: publicUser(user) }, { status: 201 });
    return attachSession(result, createSessionToken(publicUser(user), user.tokenVersion));
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ success: false, error: '该用户名已被使用' }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: '注册失败，请稍后重试' }, { status: 500 });
  }
}
