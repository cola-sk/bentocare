import { Child, ServiceItem, AttendanceRecord, PrepaidRecord } from './types';
import { getDayInfo } from './holidays';

export const DEFAULT_CHILD: Child = {
  id: 'child-1',
  name: '豆豆',
  avatar: 'Smile',
  grade: '小学一年级 (2) 班',
  isDefault: true,
};

export const DEFAULT_ITEMS: ServiceItem[] = [
  {
    id: 'item-lunch',
    childId: 'child-1',
    name: '学校午餐与点心',
    icon: 'Utensils',
    color: '#f97316',
    billingType: 'PER_MONTH',
    dayPrice: 0,
    monthPrice: 1200,
    refundPerDay: 60,
    refundMode: 'FIXED',
    refundFixedDays: 22,
    defaultChildCount: 1,
    applicableDays: ['WORKDAY'],
    isActive: true,
    sortOrder: 1,
  },
  {
    id: 'item-care',
    childId: 'child-1',
    name: '校外午休小饭桌',
    icon: 'Home',
    color: '#3b82f6',
    billingType: 'PER_MONTH',
    dayPrice: 0,
    monthPrice: 800,
    refundPerDay: 40,
    refundMode: 'FIXED',
    refundFixedDays: 22,
    defaultChildCount: 1,
    applicableDays: ['WORKDAY'],
    isActive: true,
    sortOrder: 2,
  },
  {
    id: 'item-bus',
    childId: 'child-1',
    name: '晚托校车接送',
    icon: 'Bus',
    color: '#10b981',
    billingType: 'PER_DAY',
    dayPrice: 25,
    monthPrice: 0,
    refundPerDay: 0,
    refundMode: 'FIXED',
    refundFixedDays: 22,
    defaultChildCount: 1,
    applicableDays: ['WORKDAY'],
    isActive: true,
    sortOrder: 3,
  },
];

export function generateInitialAttendances(childId: string, currentYearMonth: string): AttendanceRecord[] {
  const [year, month] = currentYearMonth.split('-').map(Number);
  const records: AttendanceRecord[] = [];
  const daysInMonth = new Date(year, month, 0).getDate();

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayInfo = getDayInfo(dateStr);

    if (dayInfo.isWorkday) {
      // 法定工作日（含调休上班）
      const isSickLeave = d === 5 || d === 6; // 示例缺勤请假
      for (const it of DEFAULT_ITEMS) {
        records.push({
          id: `att-${childId}-${it.id}-${dateStr}`,
          childId,
          itemId: it.id,
          date: dateStr,
          status: isSickLeave ? 'ABSENT' : 'PRESENT',
          childCount: it.defaultChildCount || 1,
          notes: isSickLeave ? '发烧请假在家' : undefined,
        });
      }
    } else {
      // 节假日或普通周末
      for (const it of DEFAULT_ITEMS) {
        records.push({
          id: `att-${childId}-${it.id}-${dateStr}`,
          childId,
          itemId: it.id,
          date: dateStr,
          status: 'OFF',
          childCount: it.defaultChildCount || 1,
        });
      }
    }
  }

  return records;
}
