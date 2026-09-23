import { Child, ServiceItem, AttendanceRecord, PrepaidRecord, ItemMonthlyBill, MonthlyBillSummary, DayType, AttendanceStatus } from './types';
import { getWorkdaysCountInMonth, getMatchingDaysCountInMonth, getDaysArrayInMonth, getDayInfo, isMatchingDayType } from './holidays';

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

  // 适用计费日期类型组合 (默认仅工作日)
  const applicableDays: DayType[] =
    item.applicableDays && item.applicableDays.length > 0 ? item.applicableDays : ['WORKDAY'];
  const calculatedDaysCount = getMatchingDaysCountInMonth(year, monthIndex0, applicableDays);

  const defaultChildCount = item.defaultChildCount && item.defaultChildCount > 0 ? item.defaultChildCount : 1;

  // 过滤出属于该项目且该月份的考勤并建立日期映射
  const monthPrefix = month; // 'YYYY-MM'
  const itemAttendances = attendances.filter(
    (att) => att.itemId === item.id && att.date.startsWith(monthPrefix)
  );
  const attendanceMap = new Map<string, AttendanceRecord>();
  for (const att of itemAttendances) {
    attendanceMap.set(att.date, att);
  }

  let presentDays = 0;
  let absentDays = 0;
  let offDays = 0;
  let presentPersonDays = 0;
  let absentPersonDays = 0;

  // 查找当月预付记录
  const prepaidRecord = prepaids.find(
    (p) => p.itemId === item.id && p.month === month
  );

  let prepaidAmount = 0;
  let refundAmount = 0;
  let actualUsedAmount = 0;
  let effectiveRefundPerDay = 0;

  if (item.billingType === 'PER_MONTH') {
    // 按月预付基准 = 单人包月单价 * 默认孩子数
    const basePrepaid = item.monthPrice * defaultChildCount;
    prepaidAmount = prepaidRecord ? prepaidRecord.amount : basePrepaid;

    if (item.refundMode === 'FIXED') {
      effectiveRefundPerDay = item.refundPerDay;
    } else if (item.refundMode === 'FIXED_DAYS_DIVIDED') {
      // 按照配置的固定时间天均摊（默认 22 天）
      const fixedDays = item.refundFixedDays && item.refundFixedDays > 0 ? item.refundFixedDays : 22;
      const totalPersonDays = fixedDays * defaultChildCount;
      effectiveRefundPerDay = totalPersonDays > 0 ? Number((prepaidAmount / totalPersonDays).toFixed(2)) : 0;
    } else if (item.refundMode === 'CALENDAR_DIVIDED') {
      // 按照当月自然日历总天数均摊（28~31天）
      const daysInMonth = new Date(year, monthIndex0 + 1, 0).getDate();
      const totalPersonDays = daysInMonth * defaultChildCount;
      effectiveRefundPerDay = totalPersonDays > 0 ? Number((prepaidAmount / totalPersonDays).toFixed(2)) : 0;
    } else {
      // 按当月计费基准天数（实际工作日）均摊 (单人单日 = 预付总额 / (计费天数 * 默认孩子数))
      const totalWorkPersonDays = calculatedDaysCount * defaultChildCount;
      effectiveRefundPerDay = totalWorkPersonDays > 0 ? Number((prepaidAmount / totalWorkPersonDays).toFixed(2)) : 0;
    }
  } else {
    // 按天计费
    prepaidAmount = prepaidRecord ? prepaidRecord.amount : 0;
    effectiveRefundPerDay = 0;
  }

  const absentDates: { date: string; notes?: string; childCount?: number; refund?: number }[] = [];

  // 全月排期逐日计算（确保包含调休上班的周末等所有工作日）
  const allDaysInMonth = getDaysArrayInMonth(year, monthIndex0);

  for (const dateStr of allDaysInMonth) {
    const dayInfo = getDayInfo(dateStr);
    const isScheduled = isMatchingDayType(dayInfo, applicableDays);
    const rec = attendanceMap.get(dateStr);

    // 考勤状态判定：有显式打卡按打卡记录；无打卡记录时，符合适用排期（如工作日，含周末调休补班）默认为出勤 PRESENT，非排期默认为 OFF
    let status: AttendanceStatus = rec ? rec.status : (isScheduled ? 'PRESENT' : 'OFF');
    // 防御性纠偏：若属于调休补班工作日且项目符合排期，但历史数据中存在无备注的 OFF 记录，修正为出勤 PRESENT
    if (dayInfo.isCompensatoryWorkday && status === 'OFF' && !rec?.notes && isScheduled) {
      status = 'PRESENT';
    }
    const childCount = rec?.childCount && rec.childCount > 0 ? rec.childCount : defaultChildCount;

    if (status === 'PRESENT') {
      presentDays++;
      presentPersonDays += childCount;
      if (item.billingType === 'PER_DAY') {
        actualUsedAmount += childCount * item.dayPrice;
      }
    } else if (status === 'ABSENT') {
      absentDays++;
      absentPersonDays += childCount;
      const dayRefund = Number((childCount * effectiveRefundPerDay).toFixed(2));
      refundAmount += dayRefund;
      absentDates.push({
        date: dateStr,
        notes: rec?.notes,
        childCount,
        refund: dayRefund,
      });
    } else if (status === 'OFF') {
      offDays++;
    }
  }

  if (item.billingType === 'PER_DAY') {
    actualUsedAmount = Number(actualUsedAmount.toFixed(2));
    refundAmount = 0;
  } else {
    refundAmount = Number(refundAmount.toFixed(2));
    actualUsedAmount = Math.max(0, Number((prepaidAmount - refundAmount).toFixed(2)));
  }

  const balance = Number((prepaidAmount - actualUsedAmount).toFixed(2));

  return {
    item,
    presentDays,
    absentDays,
    offDays,
    presentPersonDays,
    absentPersonDays,
    defaultChildCount,
    applicableDays,
    calculatedDaysCount,
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
