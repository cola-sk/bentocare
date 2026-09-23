import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { DEFAULT_CHILD, DEFAULT_ITEMS } from '@/lib/sample-data';
import { requireAuth } from '@/lib/auth';

export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if ('response' in auth) return auth.response;
  try {
    let children = await prisma.child.findMany({
      where: { userId: auth.user.id },
      orderBy: { createdAt: 'asc' },
    });

    // 如果数据库为空，自动初始化一条默认孩子数据
    if (children.length === 0) {
      const created = await prisma.child.create({
        data: {
          userId: auth.user.id,
          name: DEFAULT_CHILD.name,
          avatar: DEFAULT_CHILD.avatar,
          grade: DEFAULT_CHILD.grade,
          isDefault: true,
          items: {
            create: DEFAULT_ITEMS.map((item) => ({
              name: item.name,
              icon: item.icon,
              color: item.color,
              billingType: item.billingType,
              dayPrice: item.dayPrice,
              monthPrice: item.monthPrice,
              refundPerDay: item.refundPerDay,
              refundMode: item.refundMode,
              isActive: item.isActive,
              sortOrder: item.sortOrder,
            })),
          },
        },
      });
      children = [created];
    }

    return NextResponse.json({ success: true, data: children });
  } catch (err: any) {
    console.warn('DB Query failed, using fallback:', err?.message);
    return NextResponse.json({ success: false, error: '读取孩子档案失败' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if ('response' in auth) return auth.response;
  try {
    const body = await request.json();
    const child = await prisma.child.create({
      data: {
        userId: auth.user.id,
        name: body.name,
        avatar: body.avatar || 'Smile',
        grade: body.grade || '小学一年级',
        isDefault: body.isDefault || false,
        items: {
          create: DEFAULT_ITEMS.map((item) => ({
            name: item.name,
            icon: item.icon,
            color: item.color,
            billingType: item.billingType,
            dayPrice: item.dayPrice,
            monthPrice: item.monthPrice,
            refundPerDay: item.refundPerDay,
            refundMode: item.refundMode,
            refundFixedDays: item.refundFixedDays,
            defaultChildCount: item.defaultChildCount,
            applicableDays: Array.isArray(item.applicableDays) ? item.applicableDays.join(',') : 'WORKDAY',
            isActive: item.isActive,
            sortOrder: item.sortOrder,
          })),
        },
      },
    });
    return NextResponse.json({ success: true, data: child });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const auth = await requireAuth(request);
  if ('response' in auth) return auth.response;
  try {
    const body = await request.json();
    const existing = await prisma.child.findFirst({ where: { id: body.id, userId: auth.user.id }, select: { id: true } });
    if (!existing) return NextResponse.json({ success: false, error: '孩子档案不存在' }, { status: 404 });
    const child = await prisma.child.update({
      where: { id: existing.id },
      data: {
        name: body.name,
        avatar: body.avatar,
        grade: body.grade,
        isDefault: body.isDefault,
      },
    });
    return NextResponse.json({ success: true, data: child });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const auth = await requireAuth(request);
  if ('response' in auth) return auth.response;
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 });

    const child = await prisma.child.findFirst({ where: { id, userId: auth.user.id }, select: { id: true } });
    if (!child) return NextResponse.json({ success: false, error: '孩子档案不存在' }, { status: 404 });
    await prisma.child.delete({ where: { id: child.id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}
