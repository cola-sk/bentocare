import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { calculateMonthlySummary } from '@/lib/calculator';
import { DEFAULT_CHILD, DEFAULT_ITEMS, generateInitialAttendances } from '@/lib/sample-data';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const childId = searchParams.get('childId');
    const month = searchParams.get('month') || new Date().toISOString().slice(0, 7);

    if (!childId) {
      return NextResponse.json({ success: false, error: 'Missing childId' }, { status: 400 });
    }

    // 查询 child, items, attendances, prepaids
    let child = await prisma.child.findUnique({ where: { id: childId } });
    if (!child) child = DEFAULT_CHILD as any;

    let items = await prisma.serviceItem.findMany({
      where: { childId, isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    if (items.length === 0) items = DEFAULT_ITEMS as any;

    let attendances = await prisma.attendanceRecord.findMany({
      where: { childId, date: { startsWith: month } },
    });
    if (attendances.length === 0) {
      attendances = generateInitialAttendances(childId, month) as any;
    }

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
    console.warn('DB bills query error, fallback:', err?.message);
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month') || '2026-09';
    const summary = calculateMonthlySummary(
      DEFAULT_CHILD,
      month,
      DEFAULT_ITEMS,
      generateInitialAttendances('child-1', month),
      []
    );
    return NextResponse.json({ success: true, fallback: true, data: summary });
  }
}
