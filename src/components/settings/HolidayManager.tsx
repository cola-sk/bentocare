'use client';

import { useState } from 'react';
import { RefreshCw, CalendarDays, Info } from 'lucide-react';
import { getDayInfo, getMatchingDaysCountInMonth } from '@/lib/holidays';

interface HolidayManagerProps {
  currentMonth: string; // YYYY-MM
  holidaySyncing: boolean;
  onSyncHolidays: (year?: number) => Promise<{ success: boolean; count?: number; year?: number; error?: string }>;
}

export function HolidayManager({
  currentMonth,
  holidaySyncing,
  onSyncHolidays,
}: HolidayManagerProps) {
  const [selectedYear, setSelectedYear] = useState<number>(() => {
    return parseInt(currentMonth.split('-')[0], 10) || new Date().getFullYear();
  });
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const handleSync = async () => {
    setSyncFeedback(null);
    const res = await onSyncHolidays(selectedYear);
    if (res.success) {
      setSyncFeedback(`成功同步 ${res.year} 年节假日数据（识别 ${res.count} 个法定安排）`);
    } else {
      setSyncFeedback(`网络拉取提示：${res.error}，已自动生效内置节假日底座`);
    }
    setTimeout(() => setSyncFeedback(null), 5000);
  };

  const [yStr, mStr] = currentMonth.split('-');
  const y = parseInt(yStr, 10);
  const mIndex = parseInt(mStr, 10) - 1;

  const currentMonthWorkdays = getMatchingDaysCountInMonth(y, mIndex, ['WORKDAY']);
  const currentMonthWeekends = getMatchingDaysCountInMonth(y, mIndex, ['WEEKEND']);
  const currentMonthHolidays = getMatchingDaysCountInMonth(y, mIndex, ['HOLIDAY']);

  const specialDaysInMonth: { date: string; name: string; isOffDay: boolean }[] = [];
  const daysInMonthCount = new Date(y, mIndex + 1, 0).getDate();
  for (let d = 1; d <= daysInMonthCount; d++) {
    const dStr = `${y}-${String(mIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const info = getDayInfo(dStr);
    if (info.isHoliday || info.isCompensatoryWorkday) {
      specialDaysInMonth.push({
        date: dStr,
        name: info.holidayName || (info.isHoliday ? '法定休假' : '调休上班'),
        isOffDay: info.isHoliday,
      });
    }
  }

  return (
    <div className="bg-white rounded-xl p-4 border border-stone-200/80 shadow-xs flex flex-col gap-3">
      {/* 头部标题与在线拉取 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-amber-50 text-amber-800 flex items-center justify-center">
            <CalendarDays className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-stone-900">
              节假日与调休识别
            </div>
            <div className="text-[10px] text-stone-400">
              内置国家法定节假日，自动识别调休工作日
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="text-xs px-2 py-1 rounded-md border border-stone-200 bg-stone-50 text-stone-700 font-medium focus:outline-none"
          >
            <option value={2024}>2024</option>
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
            <option value={2027}>2027</option>
          </select>

          <button
            onClick={handleSync}
            disabled={holidaySyncing}
            className="flex items-center gap-1 text-[11px] text-stone-700 bg-stone-100 hover:bg-stone-200 font-medium px-2.5 py-1 rounded-md transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${holidaySyncing ? 'animate-spin' : ''}`} />
            <span>{holidaySyncing ? '同步中' : '同步'}</span>
          </button>
        </div>
      </div>

      {syncFeedback && (
        <div className="text-[11px] bg-amber-50/60 border border-amber-200 text-amber-900 px-2.5 py-1.5 rounded-md flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 shrink-0" />
          <span>{syncFeedback}</span>
        </div>
      )}

      {/* 当月日期类型天数统计 */}
      <div className="grid grid-cols-3 gap-2 bg-stone-50 p-2.5 rounded-lg border border-stone-100 text-center">
        <div>
          <div className="text-[10px] text-stone-400">工作日 (含调休)</div>
          <div className="text-sm font-semibold text-stone-800 mt-0.5">
            {currentMonthWorkdays} 天
          </div>
        </div>

        <div className="border-x border-stone-200/70">
          <div className="text-[10px] text-stone-400">公休周末</div>
          <div className="text-sm font-semibold text-stone-800 mt-0.5">
            {currentMonthWeekends} 天
          </div>
        </div>

        <div>
          <div className="text-[10px] text-rose-500">法定假</div>
          <div className="text-sm font-semibold text-rose-600 mt-0.5">
            {currentMonthHolidays} 天
          </div>
        </div>
      </div>

      {/* 当月特殊日程安排 */}
      {specialDaysInMonth.length > 0 && (
        <div className="flex flex-col gap-1">
          <div className="text-[10px] font-medium text-stone-400">
            {currentMonth} 特殊日程:
          </div>
          <div className="flex flex-wrap gap-1">
            {specialDaysInMonth.map((sd) => (
              <div
                key={sd.date}
                className="text-[10px] px-2 py-0.5 rounded-md flex items-center gap-1 bg-stone-50 border border-stone-200 text-stone-700"
              >
                <span>{sd.date.slice(5)}</span>
                <span>{sd.name}</span>
                <span
                  className={`px-0.5 rounded font-bold text-[9px] ${
                    sd.isOffDay ? 'text-rose-700 bg-rose-50 border border-rose-100' : 'text-amber-800 bg-amber-100/60 border border-amber-200/60'
                  }`}
                >
                  {sd.isOffDay ? '休' : '班'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
