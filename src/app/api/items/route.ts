import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { DEFAULT_ITEMS } from '@/lib/sample-data';
import { requireAuth } from '@/lib/auth';

export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if ('response' in auth) return auth.response;
  try {
    const { searchParams } = new URL(request.url);
    const childId = searchParams.get('childId');

    if (!childId) {
      return NextResponse.json({ success: false, error: 'Missing childId' }, { status: 400 });
    }

    const child = await prisma.child.findFirst({ where: { id: childId, userId: auth.user.id }, select: { id: true } });
    if (!child) return NextResponse.json({ success: false, error: '孩子档案不存在' }, { status: 404 });
    const items = await prisma.serviceItem.findMany({
      where: { childId: child.id },
      orderBy: { sortOrder: 'asc' },
    });

    const formatted = items.map((it) => ({
      ...it,
      applicableDays: it.applicableDays ? it.applicableDays.split(',') : ['WORKDAY'],
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (err: any) {
    console.warn('DB items query error, fallback:', err?.message);
    return NextResponse.json({ success: false, error: '读取服务项目失败' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if ('response' in auth) return auth.response;
  try {
    const body = await request.json();
    const applicableDaysStr = Array.isArray(body.applicableDays)
      ? body.applicableDays.join(',')
      : (body.applicableDays || 'WORKDAY');

    const child = await prisma.child.findFirst({ where: { id: body.childId, userId: auth.user.id }, select: { id: true } });
    if (!child) return NextResponse.json({ success: false, error: '孩子档案不存在' }, { status: 404 });
    const item = await prisma.serviceItem.create({
      data: {
        childId: child.id,
        name: body.name,
        icon: body.icon || 'Utensils',
        color: body.color || '#f97316',
        billingType: body.billingType || 'PER_MONTH',
        dayPrice: Number(body.dayPrice) || 0,
        monthPrice: Number(body.monthPrice) || 0,
        refundPerDay: Number(body.refundPerDay) || 0,
        refundMode: body.refundMode || 'FIXED',
        refundFixedDays: Number(body.refundFixedDays) || 22,
        defaultChildCount: Number(body.defaultChildCount) || 1,
        applicableDays: applicableDaysStr,
        isActive: body.isActive !== undefined ? body.isActive : true,
        sortOrder: Number(body.sortOrder) || 0,
      },
    });
    return NextResponse.json({
      success: true,
      data: { ...item, applicableDays: item.applicableDays ? item.applicableDays.split(',') : ['WORKDAY'] },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const auth = await requireAuth(request);
  if ('response' in auth) return auth.response;
  try {
    const body = await request.json();
    const applicableDaysStr = Array.isArray(body.applicableDays)
      ? body.applicableDays.join(',')
      : (body.applicableDays || 'WORKDAY');

    const existing = await prisma.serviceItem.findFirst({ where: { id: body.id, child: { userId: auth.user.id } }, select: { id: true } });
    if (!existing) return NextResponse.json({ success: false, error: '服务项目不存在' }, { status: 404 });
    const item = await prisma.serviceItem.update({
      where: { id: existing.id },
      data: {
        name: body.name,
        icon: body.icon,
        color: body.color,
        billingType: body.billingType,
        dayPrice: Number(body.dayPrice) || 0,
        monthPrice: Number(body.monthPrice) || 0,
        refundPerDay: Number(body.refundPerDay) || 0,
        refundMode: body.refundMode,
        refundFixedDays: Number(body.refundFixedDays) || 22,
        defaultChildCount: Number(body.defaultChildCount) || 1,
        applicableDays: applicableDaysStr,
        isActive: body.isActive,
        sortOrder: Number(body.sortOrder) || 0,
      },
    });
    return NextResponse.json({
      success: true,
      data: { ...item, applicableDays: item.applicableDays ? item.applicableDays.split(',') : ['WORKDAY'] },
    });
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

    const item = await prisma.serviceItem.findFirst({ where: { id, child: { userId: auth.user.id } }, select: { id: true } });
    if (!item) return NextResponse.json({ success: false, error: '服务项目不存在' }, { status: 404 });
    await prisma.serviceItem.delete({ where: { id: item.id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}
