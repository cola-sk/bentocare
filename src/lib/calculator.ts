import { Child, ServiceItem, AttendanceRecord, PrepaidRecord, ItemMonthlyBill, MonthlyBillSummary } from './types';
import { getWorkdaysCountInMonth } from './holidays';

/**
 * 计算单个项目在指定月份的费用与退费明细
 */
export function calculateItemMonthlyBill(
  item: ServiceItem,
  month: string, // YYYY-MM
  attendances: AttendanceRecord[],
  prepaids: PrepaidRecord[]
): ItemMonthlyBill {
  const [yearStr, monthStr] = month.split('-');
  const year = parseInt(yearStr, 10);
  const monthIndex0 = parseInt(monthStr, 10) - 1;
  const workdayCount = getWorkdaysCountInMonth(year, monthIndex0);

  // 过滤出属于该项目且该月份的考勤
  const monthPrefix = month; // 'YYYY-MM'
  const itemAttendances = attendances.filter(
    (att) => att.itemId === item.id && att.date.startsWith(monthPrefix)
  );

  let presentDays = 0;
  let absentDays = 0;
  let offDays = 0;
  const absentDates: { date: string; notes?: string }[] = [];

  for (const att of itemAttendances) {
    if (att.status === 'PRESENT') {
      presentDays++;
    } else if (att.status === 'ABSENT') {
      absentDays++;
      absentDates.push({ date: att.date, notes: att.notes });
    } else if (att.status === 'OFF') {
      offDays++;
    }
  }

  // 查找当月预付记录
  const prepaidRecord = prepaids.find(
    (p) => p.itemId === item.id && p.month === month
  );

  let prepaidAmount = 0;
  let refundAmount = 0;
  let actualUsedAmount = 0;
  let effectiveRefundPerDay = 0;

  if (item.billingType === 'PER_DAY') {
    // 按天计费
    prepaidAmount = prepaidRecord ? prepaidRecord.amount : 0;
    actualUsedAmount = Number((presentDays * item.dayPrice).toFixed(2));
    refundAmount = 0;
    effectiveRefundPerDay = 0;
  } else {
    // 按月预付 + 缺勤退费
    // 如果有自定义预付金额则使用，否则默认项目包月标准
    prepaidAmount = prepaidRecord ? prepaidRecord.amount : item.monthPrice;

    if (item.refundMode === 'FIXED') {
      effectiveRefundPerDay = item.refundPerDay;
    } else {
      // 按当月工作日均摊
      effectiveRefundPerDay = workdayCount > 0 ? Number((prepaidAmount / workdayCount).toFixed(2)) : 0;
    }

    refundAmount = Number((absentDays * effectiveRefundPerDay).toFixed(2));
    actualUsedAmount = Math.max(0, Number((prepaidAmount - refundAmount).toFixed(2)));
  }

  const balance = Number((prepaidAmount - actualUsedAmount).toFixed(2));

  return {
    item,
    presentDays,
    absentDays,
    offDays,
    workdayCount,
    effectiveRefundPerDay,
    prepaidAmount,
    refundAmount,
    actualUsedAmount,
    balance,
    absentDates: absentDates.sort((a, b) => a.date.localeCompare(b.date)),
  };
}

/**
 * 汇总计算孩子在指定月份的总账单
 */
export function calculateMonthlySummary(
  child: Child,
  month: string, // YYYY-MM
  items: ServiceItem[],
  attendances: AttendanceRecord[],
  prepaids: PrepaidRecord[]
): MonthlyBillSummary {
  const [yearStr, monthStr] = month.split('-');
  const year = parseInt(yearStr, 10);
  const monthIndex0 = parseInt(monthStr, 10) - 1;
  const workdayCount = getWorkdaysCountInMonth(year, monthIndex0);

  // 仅计算该孩子的活跃项目
  const childItems = items.filter((it) => it.childId === child.id && it.isActive);

  const itemBills = childItems.map((item) =>
    calculateItemMonthlyBill(item, month, attendances, prepaids)
  );

  let totalPrepaid = 0;
  let totalRefund = 0;
  let totalPerDayCost = 0;

  for (const ib of itemBills) {
    if (ib.item.billingType === 'PER_MONTH') {
      totalPrepaid += ib.prepaidAmount;
      totalRefund += ib.refundAmount;
    } else {
      totalPerDayCost += ib.actualUsedAmount;
    }
  }

  totalPrepaid = Number(totalPrepaid.toFixed(2));
  totalRefund = Number(totalRefund.toFixed(2));
  totalPerDayCost = Number(totalPerDayCost.toFixed(2));

  // 总实际应付 = 包月实耗 (预付 - 退费) + 按天实耗
  const totalActualCost = Number(((totalPrepaid - totalRefund) + totalPerDayCost).toFixed(2));
  // 总结余 = 预付总额 - 总实际应付 = 缺勤应退 - 按天实际消费
  const finalBalance = Number((totalPrepaid - totalActualCost).toFixed(2));

  return {
    month,
    child,
    workdayCount,
    totalPrepaid,
    totalRefund,
    totalPerDayCost,
    totalActualCost,
    finalBalance,
    itemBills,
  };
}
