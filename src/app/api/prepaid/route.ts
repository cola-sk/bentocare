import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if ('response' in auth) return auth.response;
  try {
    const { searchParams } = new URL(request.url);
    const childId = searchParams.get('childId');
    const month = searchParams.get('month');

    if (!childId) {
      return NextResponse.json({ success: false, error: 'Missing childId' }, { status: 400 });
    }

    const child = await prisma.child.findFirst({ where: { id: childId, userId: auth.user.id }, select: { id: true } });
    if (!child) return NextResponse.json({ success: false, error: '孩子档案不存在' }, { status: 404 });
    const whereClause: any = { childId: child.id };
    if (month) whereClause.month = month;

    const prepaids = await prisma.prepaidRecord.findMany({
      where: whereClause,
    });

    return NextResponse.json({ success: true, data: prepaids });
  } catch (err: any) {
    console.warn('DB prepaid query error, fallback:', err?.message);
    return NextResponse.json({ success: false, error: '读取预付款失败' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if ('response' in auth) return auth.response;
  try {
    const body = await request.json();
    const item = await prisma.serviceItem.findFirst({ where: { id: body.itemId, childId: body.childId, child: { userId: auth.user.id } }, select: { id: true, childId: true } });
    if (!item) return NextResponse.json({ success: false, error: '服务项目不存在' }, { status: 404 });
    const record = await prisma.prepaidRecord.upsert({
      where: {
        childId_itemId_month: {
          childId: item.childId,
          itemId: item.id,
          month: body.month,
        },
      },
      create: {
        childId: item.childId,
        itemId: item.id,
        month: body.month,
        amount: Number(body.amount) || 0,
        isPaid: body.isPaid !== undefined ? body.isPaid : true,
        notes: body.notes || null,
      },
      update: {
        amount: Number(body.amount) || 0,
        isPaid: body.isPaid !== undefined ? body.isPaid : true,
        notes: body.notes || null,
      },
    });

    return NextResponse.json({ success: true, data: record });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}
