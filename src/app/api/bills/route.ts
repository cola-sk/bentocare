import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { calculateMonthlySummary } from '@/lib/calculator';
import { DEFAULT_CHILD, DEFAULT_ITEMS, generateInitialAttendances } from '@/lib/sample-data';
import { requireAuth } from '@/lib/auth';

export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if ('response' in auth) return auth.response;
  try {
    const { searchParams } = new URL(request.url);
    const childId = searchParams.get('childId');
    const month = searchParams.get('month') || new Date().toISOString().slice(0, 7);

    if (!childId) {
      return NextResponse.json({ success: false, error: 'Missing childId' }, { status: 400 });
    }

    // 查询 child, items, attendances, prepaids
    const child = await prisma.child.findFirst({ where: { id: childId, userId: auth.user.id } });
    if (!child) return NextResponse.json({ success: false, error: '孩子档案不存在' }, { status: 404 });

    let items = await prisma.serviceItem.findMany({
      where: { childId, isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    let attendances = await prisma.attendanceRecord.findMany({
      where: { childId, date: { startsWith: month } },
    });

    const prepaids = await prisma.prepaidRecord.findMany({
      where: { childId, month },
    });

    const summary = calculateMonthlySummary(
      child as any,
      month,
      items as any,
      attendances as any,
      prepaids as any
    );

    return NextResponse.json({ success: true, data: summary });
  } catch (err: any) {
    console.warn('DB bills query error:', err?.message);
    return NextResponse.json({ success: false, error: '读取账单失败' }, { status: 500 });
  }
}
