import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateInitialAttendances } from '@/lib/sample-data';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const childId = searchParams.get('childId');
    const month = searchParams.get('month'); // YYYY-MM

    if (!childId) {
      return NextResponse.json({ success: false, error: 'Missing childId' }, { status: 400 });
    }

    const whereClause: any = { childId };
    if (month) {
      whereClause.date = { startsWith: month };
    }

    let records = await prisma.attendanceRecord.findMany({
      where: whereClause,
      orderBy: { date: 'asc' },
    });

    if (records.length === 0 && month) {
      records = generateInitialAttendances(childId, month) as any;
    }

    return NextResponse.json({ success: true, data: records });
  } catch (err: any) {
    console.warn('DB attendance query error, fallback:', err?.message);
    const { searchParams } = new URL(request.url);
    const childId = searchParams.get('childId') || 'child-1';
    const month = searchParams.get('month') || '2026-09';
    return NextResponse.json({
      success: false,
      fallback: true,
      data: generateInitialAttendances(childId, month),
    });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 检查是否是批量保存
    if (Array.isArray(body)) {
      const results = await Promise.all(
        body.map((rec) =>
          prisma.attendanceRecord.upsert({
            where: {
              childId_itemId_date: {
                childId: rec.childId,
                itemId: rec.itemId,
                date: rec.date,
              },
            },
            create: {
              childId: rec.childId,
              itemId: rec.itemId,
              date: rec.date,
              status: rec.status,
              notes: rec.notes || null,
            },
            update: {
              status: rec.status,
              notes: rec.notes || null,
            },
          })
        )
      );
      return NextResponse.json({ success: true, data: results });
    }

    // 单条记录 Upsert
    const record = await prisma.attendanceRecord.upsert({
      where: {
        childId_itemId_date: {
          childId: body.childId,
          itemId: body.itemId,
          date: body.date,
        },
      },
      create: {
        childId: body.childId,
        itemId: body.itemId,
        date: body.date,
        status: body.status,
        notes: body.notes || null,
      },
      update: {
        status: body.status,
        notes: body.notes || null,
      },
    });

    return NextResponse.json({ success: true, data: record });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}
