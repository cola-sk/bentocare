import { getDaysInMonth, getDay, format } from 'date-fns';

/**
 * 获取某月的所有日期字符串 (YYYY-MM-DD)
 */
export function getDaysArrayInMonth(year: number, monthIndex0: number): string[] {
  const daysCount = getDaysInMonth(new Date(year, monthIndex0));
  const dates: string[] = [];
  for (let d = 1; d <= daysCount; d++) {
    const dayStr = `${year}-${String(monthIndex0 + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    dates.push(dayStr);
  }
  return dates;
}

/**
 * 判断某天是否为通常工作日 (周一到周五)
 */
export function isDefaultWorkday(dateStr: string): boolean {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const dayOfWeek = getDay(date); // 0 = Sunday, 6 = Saturday
  return dayOfWeek >= 1 && dayOfWeek <= 5;
}

/**
 * 计算某月份的标准工作日天数 (周一至周五数量)
 */
export function getWorkdaysCountInMonth(year: number, monthIndex0: number): number {
  const allDays = getDaysArrayInMonth(year, monthIndex0);
  return allDays.filter(isDefaultWorkday).length;
}
