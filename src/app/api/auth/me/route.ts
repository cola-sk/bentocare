import { NextResponse } from 'next/server';
import { getAuthenticatedUser, publicUser } from '@/lib/auth';

export async function GET(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ success: false, error: '未登录', code: 'UNAUTHORIZED' }, { status: 401 });
  return NextResponse.json({ success: true, data: publicUser(user) });
}
