export type BillingType = 'PER_DAY' | 'PER_MONTH';
export type RefundMode = 'FIXED' | 'WORKDAY_DIVIDED';
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'OFF';

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
  dayPrice: number; // 元/天
  monthPrice: number; // 元/月
  refundPerDay: number; // 元/天 (若 FIXED)
  refundMode: RefundMode;
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
  presentDays: number;
  absentDays: number;
  offDays: number;
  workdayCount: number;
  effectiveRefundPerDay: number;
  prepaidAmount: number; // 预付金额
  refundAmount: number; // 缺勤应退额
  actualUsedAmount: number; // 实际产生/消费金额
  balance: number; // 差额 (预付 - 实际消费，正数为退还/结余，负数为补交)
  absentDates: { date: string; notes?: string }[];
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
