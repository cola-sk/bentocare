'use client';

import { useMemo } from 'react';
import { ServiceItem, AttendanceRecord } from '@/lib/types';
import { getDaysInMonth, getDay, format, parse } from 'date-fns';
import { cn } from '@/lib/utils';
import { Check, X, Minus, Sparkles } from 'lucide-react';

interface MonthCalendarProps {
  currentMonth: string; // YYYY-MM
  items: ServiceItem[];
  attendances: AttendanceRecord[];
  onSelectDate: (dateStr: string) => void;
  selectedDate: string;
}

export function MonthCalendar({
  currentMonth,
  items,
  attendances,
  onSelectDate,
  selectedDate,
}: MonthCalendarProps) {
  const monthDate = parse(currentMonth, 'yyyy-MM', new Date());
  const year = monthDate.getFullYear();
  const monthIndex = monthDate.getMonth();
  const daysInMonth = getDaysInMonth(monthDate);
  const firstDayOfWeek = getDay(new Date(year, monthIndex, 1)); // 0 = Sun, 1 = Mon ...

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  // 构建当月考勤映射：date -> Record<itemId, AttendanceRecord>
  const attendanceMap = useMemo(() => {
    const map: Record<string, Record<string, AttendanceRecord>> = {};
    for (const att of attendances) {
      if (!map[att.date]) map[att.date] = {};
      map[att.date][att.itemId] = att;
    }
    return map;
  }, [attendances]);

  // 星期表头
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <div className="bg-white rounded-3xl p-4 shadow-card border border-slate-100">
      {/* 星期行 */}
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {weekDays.map((w, idx) => (
          <div
            key={w}
            className={cn(
              'text-xs font-semibold py-1',
              idx === 0 || idx === 6 ? 'text-rose-400' : 'text-slate-400'
            )}
          >
            {w}
          </div>
        ))}
      </div>

      {/* 日历格子 */}
      <div className="grid grid-cols-7 gap-1.5">
        {/* 前置空白 */}
        {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
          <div key={`empty-${idx}`} className="h-14 rounded-2xl bg-transparent" />
        ))}

        {/* 当月日期 */}
        {Array.from({ length: daysInMonth }).map((_, idx) => {
          const day = idx + 1;
          const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;
          const dayDate = new Date(year, monthIndex, day);
          const dayOfWeek = getDay(dayDate);
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

          const dayRecords = attendanceMap[dateStr] || {};
          const dayItemsStatus = items.map((it) => dayRecords[it.id]?.status || (isWeekend ? 'OFF' : 'PRESENT'));

          const hasAbsent = dayItemsStatus.some((s) => s === 'ABSENT');
          const allPresent = items.length > 0 && dayItemsStatus.every((s) => s === 'PRESENT');
          const allOff = items.length > 0 && dayItemsStatus.every((s) => s === 'OFF');

          return (
            <button
              key={dateStr}
              onClick={() => onSelectDate(dateStr)}
              className={cn(
                'relative h-14 rounded-2xl p-1 flex flex-col items-center justify-between border transition-all duration-200 select-none active:scale-95',
                isSelected
                  ? 'border-brand-500 bg-brand-50/50 ring-2 ring-brand-400/30'
                  : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50/50',
                hasAbsent && 'bg-red-50/40 border-red-200',
                isToday && !isSelected && 'bg-amber-50/30 border-amber-300'
              )}
            >
              {/* 日期数字与今日标识 */}
              <div className="flex items-center justify-between w-full px-1">
                <span
                  className={cn(
                    'text-xs font-bold leading-none',
                    isToday ? 'text-brand-600' : isWeekend ? 'text-rose-400' : 'text-slate-700'
                  )}
                >
                  {day}
                </span>
                {isToday && (
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
                )}
              </div>

              {/* 项目考勤状态小圆点/图标指示 */}
              <div className="flex items-center justify-center gap-1 w-full my-auto">
                {items.slice(0, 3).map((item) => {
                  const status = dayRecords[item.id]?.status || (isWeekend ? 'OFF' : 'PRESENT');
                  let dotColor = 'bg-emerald-400';
                  if (status === 'ABSENT') dotColor = 'bg-rose-500 ring-2 ring-rose-200';
                  if (status === 'OFF') dotColor = 'bg-slate-300';

                  return (
                    <span
                      key={item.id}
                      className={cn('w-2 h-2 rounded-full transition-transform', dotColor)}
                      title={`${item.name}: ${status === 'PRESENT' ? '出勤' : status === 'ABSENT' ? '请假' : '休息'}`}
                    />
                  );
                })}
              </div>

              {/* 底部摘要标签 */}
              <div className="text-[9px] font-medium leading-none mb-0.5">
                {hasAbsent ? (
                  <span className="text-rose-500 font-bold">请假</span>
                ) : allOff ? (
                  <span className="text-slate-400">休</span>
                ) : allPresent ? (
                  <span className="text-emerald-600">全勤</span>
                ) : (
                  <span className="text-slate-500">记账</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* 图例说明 */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-center gap-4 text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <span>出勤/用餐</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          <span>请假/缺勤 (退费)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
          <span>休息/无托管</span>
        </div>
      </div>
    </div>
  );
}
