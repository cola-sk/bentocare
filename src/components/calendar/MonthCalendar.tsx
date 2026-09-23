'use client';

import { useMemo } from 'react';
import { ServiceItem, AttendanceRecord } from '@/lib/types';
import { getDayInfo, isMatchingDayType } from '@/lib/holidays';
import { getDaysInMonth, getDay, format, parse } from 'date-fns';
import { cn } from '@/lib/utils';

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
    <div className="bg-white rounded-xl p-3.5 border border-stone-200/80 shadow-xs">
      {/* 星期行 */}
      <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
        {weekDays.map((w, idx) => (
          <div
            key={w}
            className={cn(
              'text-[11px] font-medium py-1',
              idx === 0 || idx === 6 ? 'text-amber-700/60' : 'text-stone-500'
            )}
          >
            {w}
          </div>
        ))}
      </div>

      {/* 日历格子 */}
      <div className="grid grid-cols-7 gap-1">
        {/* 前置空白 */}
        {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
          <div key={`empty-${idx}`} className="h-13 rounded-lg bg-transparent" />
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

          const dayInfo = getDayInfo(dateStr);
          const dayRecords = attendanceMap[dateStr] || {};

          // 考勤状态判定（含调休工作日防御性纠偏）
          const resolveItemStatus = (it: ServiceItem) => {
            const isScheduled = isMatchingDayType(dayInfo, it.applicableDays);
            const rec = dayRecords[it.id];
            let status = rec?.status || (isScheduled ? 'PRESENT' : 'OFF');
            if (dayInfo.isCompensatoryWorkday && status === 'OFF' && !rec?.notes && isScheduled) {
              status = 'PRESENT';
            }
            return status;
          };

          const dayItemsStatus = items.map(resolveItemStatus);
          const hasAbsent = dayItemsStatus.some((s) => s === 'ABSENT');
          const allOff = items.length > 0 && dayItemsStatus.every((s) => s === 'OFF');

          return (
            <button
              key={dateStr}
              onClick={() => onSelectDate(dateStr)}
              className={cn(
                'relative h-13 rounded-lg p-1 flex flex-col items-center justify-between border transition-all duration-150 select-none active:scale-95',
                isSelected
                  ? 'border-2 border-brand-500 bg-brand-50/60 font-bold shadow-2xs'
                  : 'border-stone-150 hover:border-stone-300 bg-white',
                hasAbsent && !isSelected && 'bg-rose-50/50 border-rose-200/70',
                isToday && !isSelected && 'border-amber-400 bg-amber-50/20'
              )}
            >
              {/* 日期数字与法定节假日/调休标 */}
              <div className="flex items-center justify-between w-full px-0.5">
                <span
                  className={cn(
                    'text-xs leading-none',
                    isSelected
                      ? 'font-bold text-stone-900'
                      : isToday
                      ? 'font-bold text-brand-600'
                      : dayInfo.isCompensatoryWorkday
                      ? 'font-semibold text-stone-800'
                      : dayInfo.isWeekend
                      ? 'text-amber-800/60'
                      : 'text-stone-700'
                  )}
                >
                  {day}
                </span>

                <div className="flex items-center gap-0.5">
                  {dayInfo.isHoliday && (
                    <span
                      className="text-[8px] font-bold px-0.5 rounded text-rose-700 bg-rose-50 border border-rose-100"
                      title={dayInfo.holidayName || '休假'}
                    >
                      休
                    </span>
                  )}
                  {dayInfo.isCompensatoryWorkday && (
                    <span
                      className="text-[8px] font-bold px-0.5 rounded text-amber-800 bg-amber-100/60"
                      title="调休工作日"
                    >
                      班
                    </span>
                  )}
                </div>
              </div>

              {/* 项目考勤指示圆点 */}
              <div className="flex items-center justify-center gap-1 w-full my-auto">
                {!allOff ? (
                  items.slice(0, 3).map((item) => {
                    const status = resolveItemStatus(item);
                    let dotColor = 'bg-emerald-500';
                    if (status === 'ABSENT') dotColor = 'bg-rose-500';
                    if (status === 'OFF') dotColor = 'bg-stone-200';

                    return (
                      <span
                        key={item.id}
                        className={cn('w-1.5 h-1.5 rounded-full', dotColor)}
                      />
                    );
                  })
                ) : (
                  <span className="w-1 h-1 rounded-full bg-stone-200" />
                )}
              </div>

              {/* 缺勤微标 */}
              <div className="h-3 flex items-center justify-center">
                {hasAbsent ? (
                  <span className="text-[9px] font-medium leading-none text-rose-500">
                    请假
                  </span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>

      {/* 极简图例说明 */}
      <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-center gap-4 text-[10px] text-stone-400">
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>出勤</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          <span>请假退费</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-stone-200" />
          <span>休息</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-1 rounded border border-rose-100">休</span>
          <span>法定假</span>
        </div>
      </div>
    </div>
  );
}
