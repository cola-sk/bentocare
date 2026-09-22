import { Child, ServiceItem, AttendanceRecord, PrepaidRecord } from './types';
import { format, subDays } from 'date-fns';

export const DEFAULT_CHILD: Child = {
  id: 'child-1',
  name: '豆豆',
  avatar: '🧒',
  grade: '小学一年级 (2) 班',
  isDefault: true,
};

export const DEFAULT_ITEMS: ServiceItem[] = [
  {
    id: 'item-lunch',
    childId: 'child-1',
    name: '学校午餐与点心',
    icon: '🍱',
    color: '#f97316',
    billingType: 'PER_MONTH',
    dayPrice: 0,
    monthPrice: 1200,
    refundPerDay: 60,
    refundMode: 'FIXED',
    isActive: true,
    sortOrder: 1,
  },
  {
    id: 'item-care',
    childId: 'child-1',
    name: '校外午休小饭桌',
    icon: '🏠',
    color: '#3b82f6',
    billingType: 'PER_MONTH',
    dayPrice: 0,
    monthPrice: 800,
    refundPerDay: 40,
    refundMode: 'FIXED',
    isActive: true,
    sortOrder: 2,
  },
  {
    id: 'item-bus',
    childId: 'child-1',
    name: '晚托校车接送',
    icon: '🚌',
    color: '#10b981',
    billingType: 'PER_DAY',
    dayPrice: 25,
    monthPrice: 0,
    refundPerDay: 0,
    refundMode: 'FIXED',
    isActive: true,
    sortOrder: 3,
  },
];

export function generateInitialAttendances(childId: string, currentYearMonth: string): AttendanceRecord[] {
  const [year, month] = currentYearMonth.split('-').map(Number);
  const records: AttendanceRecord[] = [];
  const today = new Date();
  const currentDay = today.getDate();

  for (let d = 1; d <= Math.min(currentDay, 28); d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dateObj = new Date(year, month - 1, d);
    const dayOfWeek = dateObj.getDay();

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      // 周末
      for (const it of DEFAULT_ITEMS) {
        records.push({
          id: `att-${childId}-${it.id}-${dateStr}`,
          childId,
          itemId: it.id,
          date: dateStr,
          status: 'OFF',
        });
      }
    } else {
      // 工作日
      const isSickLeave = d === 5 || d === 6; // 示例缺勤请假
      for (const it of DEFAULT_ITEMS) {
        records.push({
          id: `att-${childId}-${it.id}-${dateStr}`,
          childId,
          itemId: it.id,
          date: dateStr,
          status: isSickLeave ? 'ABSENT' : 'PRESENT',
          notes: isSickLeave ? '发烧请假在家' : undefined,
        });
      }
    }
  }

  return records;
}
