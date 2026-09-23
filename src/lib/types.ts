export type BillingType = 'PER_DAY' | 'PER_MONTH';
export type RefundMode = 'WORKDAY_DIVIDED' | 'FIXED_DAYS_DIVIDED' | 'CALENDAR_DIVIDED' | 'FIXED';
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'OFF';
export type DayType = 'WORKDAY' | 'WEEKEND' | 'HOLIDAY';

export interface Child {
  id: string;
  name: string;
  avatar?: string;
  grade?: string;
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ServiceItem {
  id: string;
  childId: string;
  name: string;
  icon: string;
  color: string;
  billingType: BillingType;
  dayPrice: number; // 元/人/天
  monthPrice: number; // 元/人/月
  refundPerDay: number; // 元/人/天 (若 FIXED)
  refundMode: RefundMode;
  refundFixedDays?: number; // 当按固定天数折算时使用的固定天数 (默认 22 天)
  defaultChildCount?: number; // 默认孩子人数 (如 1人, 2人)
  applicableDays?: DayType[]; // 计费与出勤日期类型 (默认 ['WORKDAY'])
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AttendanceRecord {
  id: string;
  childId: string;
  itemId: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  childCount?: number; // 当天出勤/请假的孩子个数 (默认 1)
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PrepaidRecord {
  id: string;
  childId: string;
  itemId: string;
  month: string; // YYYY-MM
  amount: number;
  isPaid: boolean;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

// 计费分析计算结果
export interface ItemMonthlyBill {
  item: ServiceItem;
  presentDays: number; // 出勤天数
  absentDays: number; // 缺勤天数
  offDays: number;
  presentPersonDays: number; // 累计出勤人天数 (天数 * 孩子人数)
  absentPersonDays: number; // 累计缺勤人天数 (天数 * 孩子人数)
  defaultChildCount: number; // 项目配置的孩子人数
  applicableDays: DayType[]; // 项目适用的日期类型
  calculatedDaysCount: number; // 当月符合配置的总计费/服务天数
  workdayCount: number; // 兼容保留法定工作日
  effectiveRefundPerDay: number; // 单人单日退费标准 (元/人/天)
  prepaidAmount: number; // 预付金额
  refundAmount: number; // 缺勤应退额
  actualUsedAmount: number; // 实际产生/消费金额
  balance: number; // 差额 (预付 - 实际消费，正数为退还/结余，负数为补交)
  absentDates: { date: string; notes?: string; childCount?: number; refund?: number }[];
}

export interface MonthlyBillSummary {
  month: string; // YYYY-MM
  child: Child;
  workdayCount: number;
  totalPrepaid: number; // 预付总额
  totalRefund: number; // 缺勤应退总额
  totalPerDayCost: number; // 按天项目实际消费
  totalActualCost: number; // 当月总实际应付净额 (预付 - 退费 + 按天)
  finalBalance: number; // 总结余/差额 (总预付 - 总实际应付 = 总退费 - 按天总消费)
  itemBills: ItemMonthlyBill[];
}
