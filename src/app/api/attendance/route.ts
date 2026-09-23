import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateInitialAttendances } from '@/lib/sample-data';
import { getDayInfo } from '@/lib/holidays';
import { requireAuth } from '@/lib/auth';

function sanitizeAttendances(records: any[]): any[] {
  return records.map((rec) => {
    if (rec.status === 'OFF' && !rec.notes) {
      const dayInfo = getDayInfo(rec.date);
      if (dayInfo.isCompensatoryWorkday) {
        return { ...rec, status: 'PRESENT' };
      }
    }
    return rec;
  });
}

export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if ('response' in auth) return auth.response;
  try {
    const { searchParams } = new URL(request.url);
    const childId = searchParams.get('childId');
    const month = searchParams.get('month'); // YYYY-MM

    if (!childId) {
      return NextResponse.json({ success: false, error: 'Missing childId' }, { status: 400 });
    }

    const child = await prisma.child.findFirst({ where: { id: childId, userId: auth.user.id }, select: { id: true } });
    if (!child) return NextResponse.json({ success: false, error: '孩子档案不存在' }, { status: 404 });
    const whereClause: any = { childId: child.id };
    if (month) {
      whereClause.date = { startsWith: month };
    }

    let records = await prisma.attendanceRecord.findMany({
      where: whereClause,
      orderBy: { date: 'asc' },
    });

    return NextResponse.json({ success: true, data: sanitizeAttendances(records) });
  } catch (err: any) {
    console.warn('DB attendance query error:', err?.message);
    return NextResponse.json({ success: false, error: '读取考勤失败' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if ('response' in auth) return auth.response;
  try {
    const body = await request.json();

    // 检查是否是批量保存
    if (Array.isArray(body)) {
      const childIds = Array.from(new Set(body.map((rec) => rec.childId)));
      const itemIds = Array.from(new Set(body.map((rec) => rec.itemId)));
      if (childIds.length !== 1 || !childIds[0]) return NextResponse.json({ success: false, error: '批量记录必须属于同一孩子' }, { status: 400 });
      const ownedItems = await prisma.serviceItem.findMany({ where: { id: { in: itemIds }, childId: childIds[0], child: { userId: auth.user.id } }, select: { id: true, childId: true } });
      if (ownedItems.length !== itemIds.length) return NextResponse.json({ success: false, error: '存在无权访问的服务项目' }, { status: 403 });
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
              childCount: Number(rec.childCount) || 1,
              notes: rec.notes || null,
            },
            update: {
              status: rec.status,
              childCount: Number(rec.childCount) || 1,
              notes: rec.notes || null,
            },
          })
        )
      );
      return NextResponse.json({ success: true, data: results });
    }

    const item = await prisma.serviceItem.findFirst({ where: { id: body.itemId, childId: body.childId, child: { userId: auth.user.id } }, select: { id: true, childId: true } });
    if (!item) return NextResponse.json({ success: false, error: '服务项目不存在' }, { status: 404 });
    // 单条记录 Upsert
    const record = await prisma.attendanceRecord.upsert({
      where: {
        childId_itemId_date: {
          childId: item.childId,
          itemId: item.id,
          date: body.date,
        },
      },
      create: {
        childId: item.childId,
        itemId: item.id,
        date: body.date,
        status: body.status,
        childCount: Number(body.childCount) || 1,
        notes: body.notes || null,
      },
      update: {
        status: body.status,
        childCount: Number(body.childCount) || 1,
        notes: body.notes || null,
      },
    });

    return NextResponse.json({ success: true, data: record });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}
