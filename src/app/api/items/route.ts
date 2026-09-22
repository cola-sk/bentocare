import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { DEFAULT_ITEMS } from '@/lib/sample-data';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const childId = searchParams.get('childId');

    if (!childId) {
      return NextResponse.json({ success: false, error: 'Missing childId' }, { status: 400 });
    }

    const items = await prisma.serviceItem.findMany({
      where: { childId },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({ success: true, data: items.length > 0 ? items : DEFAULT_ITEMS });
  } catch (err: any) {
    console.warn('DB items query error, fallback:', err?.message);
    return NextResponse.json({ success: false, fallback: true, data: DEFAULT_ITEMS });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const item = await prisma.serviceItem.create({
      data: {
        childId: body.childId,
        name: body.name,
        icon: body.icon || '🍱',
        color: body.color || '#f97316',
        billingType: body.billingType || 'PER_MONTH',
        dayPrice: Number(body.dayPrice) || 0,
        monthPrice: Number(body.monthPrice) || 0,
        refundPerDay: Number(body.refundPerDay) || 0,
        refundMode: body.refundMode || 'FIXED',
        isActive: body.isActive !== undefined ? body.isActive : true,
        sortOrder: Number(body.sortOrder) || 0,
      },
    });
    return NextResponse.json({ success: true, data: item });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const item = await prisma.serviceItem.update({
      where: { id: body.id },
      data: {
        name: body.name,
        icon: body.icon,
        color: body.color,
        billingType: body.billingType,
        dayPrice: Number(body.dayPrice) || 0,
        monthPrice: Number(body.monthPrice) || 0,
        refundPerDay: Number(body.refundPerDay) || 0,
        refundMode: body.refundMode,
        isActive: body.isActive,
        sortOrder: Number(body.sortOrder) || 0,
      },
    });
    return NextResponse.json({ success: true, data: item });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 });

    await prisma.serviceItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}
