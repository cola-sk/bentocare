import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const childId = searchParams.get('childId');
    const month = searchParams.get('month');

    if (!childId) {
      return NextResponse.json({ success: false, error: 'Missing childId' }, { status: 400 });
    }

    const whereClause: any = { childId };
    if (month) whereClause.month = month;

    const prepaids = await prisma.prepaidRecord.findMany({
      where: whereClause,
    });

    return NextResponse.json({ success: true, data: prepaids });
  } catch (err: any) {
    console.warn('DB prepaid query error, fallback:', err?.message);
    return NextResponse.json({ success: false, fallback: true, data: [] });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const record = await prisma.prepaidRecord.upsert({
      where: {
        childId_itemId_month: {
          childId: body.childId,
          itemId: body.itemId,
          month: body.month,
        },
      },
      create: {
        childId: body.childId,
        itemId: body.itemId,
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
