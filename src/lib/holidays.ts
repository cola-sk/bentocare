import { getDaysInMonth, getDay, parse } from 'date-fns';
import { DayType } from './types';
import { BUILTIN_HOLIDAYS_MAP, HolidayItem } from './holiday-data';

export type { HolidayItem };
export { BUILTIN_HOLIDAYS_MAP };

export interface DayInfo {
  date: string; // YYYY-MM-DD
  dayOfWeek: number; // 0 = 周日, 1 = 周一, ... 6 = 周六
  dayType: DayType; // 'WORKDAY' | 'WEEKEND' | 'HOLIDAY'
  isWorkday: boolean; // 工作日（含调休上班）
  isWeekend: boolean; // 普通周末公休
  isHoliday: boolean; // 法定节假日放假
  isCompensatoryWorkday: boolean; // 周末调休上班 (班)
  holidayName?: string; // 节假日名称，如"国庆节"、"中秋节"、"除夕/春节"
  badgeText?: string; // '休' | '班'
}

// 客户端与运行时的缓存
let memoryHolidayCache: Record<string, HolidayItem> | null = null;
const STORAGE_KEY_HOLIDAYS = 'bentocare_chinese_holidays';

/**
 * 获取当前已加载的所有节假日字典（合并内置与本地缓存）
 */
export function getActiveHolidayMap(): Record<string, HolidayItem> {
  if (memoryHolidayCache) {
    return memoryHolidayCache;
  }

  let map: Record<string, HolidayItem> = { ...BUILTIN_HOLIDAYS_MAP };

  // 尝试从浏览器 localStorage 读取
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_HOLIDAYS);
      if (stored) {
        const parsed = JSON.parse(stored);
        map = { ...map, ...parsed };
      }
    } catch (e) {
      // ignore
    }
  }

  memoryHolidayCache = map;
  return map;
}

/**
 * 更新本地节假日字典缓存
 */
export function saveHolidayCache(newItems: HolidayItem[]): void {
  const current = getActiveHolidayMap();
  for (const item of newItems) {
    current[item.date] = item;
  }
  memoryHolidayCache = { ...current };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY_HOLIDAYS, JSON.stringify(current));
    } catch (e) {
      console.warn('Failed to save holidays to localStorage:', e);
    }
  }
}

/**
 * 在线拉取指定年份的中国节假日数据并更新缓存
 */
export async function fetchAndCacheHolidays(year: number): Promise<HolidayItem[]> {
  try {
    const res = await fetch(`/api/holidays?year=${year}`);
    const result = await res.json();
    if (result.success && Array.isArray(result.data)) {
      saveHolidayCache(result.data);
      return result.data;
    }
  } catch (err) {
    console.warn(`拉取 ${year} 节假日异常:`, err);
  }
  return [];
}

/**
 * 标准化日期字符串为 YYYY-MM-DD
 */
export function normalizeDateString(dateStr: string): string {
  const parts = dateStr.trim().split(/[-/]/).map(Number);
  if (parts.length >= 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    return `${parts[0]}-${String(parts[1]).padStart(2, '0')}-${String(parts[2]).padStart(2, '0')}`;
  }
  return dateStr;
}

/**
 * 解析某一天详细信息（是否法定节假日休假、调休上班、周末公休或工作日）
 */
export function getDayInfo(dateStr: string, customMap?: Record<string, HolidayItem>): DayInfo {
  const normalized = normalizeDateString(dateStr);
  const [y, m, d] = normalized.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  const dayOfWeek = getDay(dateObj); // 0 = Sunday, 6 = Saturday

  const holidayMap = customMap || getActiveHolidayMap();
  const holiday = holidayMap[normalized];

  if (holiday) {
    if (holiday.isOffDay) {
      // 法定节假日放假
      return {
        date: normalized,
        dayOfWeek,
        dayType: 'HOLIDAY',
        isWorkday: false,
        isWeekend: false,
        isHoliday: true,
        isCompensatoryWorkday: false,
        holidayName: holiday.name,
        badgeText: '休',
      };
    } else {
      // 调休上班（补班工作日）
      return {
        date: normalized,
        dayOfWeek,
        dayType: 'WORKDAY',
        isWorkday: true,
        isWeekend: false,
        isHoliday: false,
        isCompensatoryWorkday: true,
        holidayName: holiday.name,
        badgeText: '班',
      };
    }
  }

  // 常规日期
  const isWeekendDay = dayOfWeek === 0 || dayOfWeek === 6;
  if (isWeekendDay) {
    return {
      date: normalized,
      dayOfWeek,
      dayType: 'WEEKEND',
      isWorkday: false,
      isWeekend: true,
      isHoliday: false,
      isCompensatoryWorkday: false,
    };
  } else {
    return {
      date: normalized,
      dayOfWeek,
      dayType: 'WORKDAY',
      isWorkday: true,
      isWeekend: false,
      isHoliday: false,
      isCompensatoryWorkday: false,
    };
  }
}

/**
 * 判断某天是否符合目标日期类型组合 (如 ['WORKDAY'], ['WORKDAY', 'WEEKEND'])
 */
export function isMatchingDayType(dayInfo: DayInfo, targetDayTypes?: DayType[]): boolean {
  if (!targetDayTypes || targetDayTypes.length === 0) {
    return dayInfo.isWorkday;
  }
  return targetDayTypes.includes(dayInfo.dayType);
}

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
 * 计算某月份符合自由组合日期配置的所有日期字符串
 */
export function getCalculatedDaysInMonth(
  year: number,
  monthIndex0: number,
  targetDayTypes: DayType[] = ['WORKDAY'],
  customMap?: Record<string, HolidayItem>
): string[] {
  const allDays = getDaysArrayInMonth(year, monthIndex0);
  return allDays.filter((dateStr) => {
    const info = getDayInfo(dateStr, customMap);
    return isMatchingDayType(info, targetDayTypes);
  });
}

/**
 * 计算某月份符合自由组合配置的天数
 */
export function getMatchingDaysCountInMonth(
  year: number,
  monthIndex0: number,
  targetDayTypes: DayType[] = ['WORKDAY'],
  customMap?: Record<string, HolidayItem>
): number {
  return getCalculatedDaysInMonth(year, monthIndex0, targetDayTypes, customMap).length;
}

/**
 * 判断某天是否为法定工作日（智能识别法定节假日与调休上班）
 */
export function isDefaultWorkday(dateStr: string, customMap?: Record<string, HolidayItem>): boolean {
  return getDayInfo(dateStr, customMap).isWorkday;
}

/**
 * 计算某月份的法定工作日天数 (自动扣除节假日并加上调休上班)
 */
export function getWorkdaysCountInMonth(
  year: number,
  monthIndex0: number,
  customMap?: Record<string, HolidayItem>
): number {
  return getMatchingDaysCountInMonth(year, monthIndex0, ['WORKDAY'], customMap);
}
