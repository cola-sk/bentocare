import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { DEFAULT_CHILD, DEFAULT_ITEMS } from '@/lib/sample-data';

export async function GET() {
  try {
    let children = await prisma.child.findMany({
      orderBy: { createdAt: 'asc' },
    });

    // 如果数据库为空，自动初始化一条默认孩子数据
    if (children.length === 0) {
      const created = await prisma.child.create({
        data: {
          id: DEFAULT_CHILD.id,
          name: DEFAULT_CHILD.name,
          avatar: DEFAULT_CHILD.avatar,
          grade: DEFAULT_CHILD.grade,
          isDefault: true,
          items: {
            create: DEFAULT_ITEMS.map((item) => ({
              id: item.id,
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
    return NextResponse.json({ success: false, fallback: true, data: [DEFAULT_CHILD] });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const child = await prisma.child.create({
      data: {
        name: body.name,
        avatar: body.avatar || '👶',
        grade: body.grade || '小学一年级',
        isDefault: body.isDefault || false,
      },
    });
    return NextResponse.json({ success: true, data: child });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const child = await prisma.child.update({
      where: { id: body.id },
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
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 });

    await prisma.child.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}
