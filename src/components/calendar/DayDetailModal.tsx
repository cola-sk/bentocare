'use client';

import { useState } from 'react';
import { ServiceItem, AttendanceRecord, AttendanceStatus } from '@/lib/types';
import { getDayInfo, isMatchingDayType } from '@/lib/holidays';
import { format, parse } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { X, MessageSquare, Edit3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DynamicIcon } from '@/components/common/DynamicIcon';

interface DayDetailModalProps {
  dateStr: string; // YYYY-MM-DD
  items: ServiceItem[];
  attendances: AttendanceRecord[];
  onUpdateAttendance: (itemId: string, date: string, status: AttendanceStatus, notes?: string, childCount?: number) => void;
  onBatchMark: (date: string, status: AttendanceStatus, notes?: string, childCounts?: Record<string, number>) => void;
  onClose: () => void;
}

export function DayDetailModal({
  dateStr,
  items,
  attendances,
  onUpdateAttendance,
  onBatchMark,
  onClose,
}: DayDetailModalProps) {
  const dateObj = parse(dateStr, 'yyyy-MM-dd', new Date());
  const formattedDate = format(dateObj, 'M月d日 EEEE', { locale: zhCN });
  const dayInfo = getDayInfo(dateStr);

  const getItemDefaultStatus = (item: ServiceItem): AttendanceStatus => {
    return isMatchingDayType(dayInfo, item.applicableDays) ? 'PRESENT' : 'OFF';
  };

  const [editingNotesItemId, setEditingNotesItemId] = useState<string | null>(null);
  const [tempNote, setTempNote] = useState('');

  // 提取当天的考勤记录
  const dayAttendanceMap: Record<string, AttendanceRecord | undefined> = {};
  for (const item of items) {
    dayAttendanceMap[item.id] = attendances.find(
      (a) => a.itemId === item.id && a.date === dateStr
    );
  }

  const handleStatusChange = (item: ServiceItem, newStatus: AttendanceStatus) => {
    const current = dayAttendanceMap[item.id];
    const count = current?.childCount ?? item.defaultChildCount ?? 1;
    onUpdateAttendance(item.id, dateStr, newStatus, current?.notes, count);
  };

  const handleChildCountChange = (item: ServiceItem, newCount: number) => {
    const validCount = Math.max(1, newCount);
    const current = dayAttendanceMap[item.id];
    const status = current?.status || getItemDefaultStatus(item);
    onUpdateAttendance(item.id, dateStr, status, current?.notes, validCount);
  };

  const handleOpenNote = (item: ServiceItem) => {
    const current = dayAttendanceMap[item.id];
    setTempNote(current?.notes || '');
    setEditingNotesItemId(item.id);
  };

  const handleSaveNote = (item: ServiceItem) => {
    const current = dayAttendanceMap[item.id];
    const status = current?.status || getItemDefaultStatus(item);
    const count = current?.childCount ?? item.defaultChildCount ?? 1;
    onUpdateAttendance(item.id, dateStr, status, tempNote, count);
    setEditingNotesItemId(null);
  };

  const handleBatchAll = (status: AttendanceStatus, notes?: string) => {
    const childCounts: Record<string, number> = {};
    for (const item of items) {
      const current = dayAttendanceMap[item.id];
      childCounts[item.id] = current?.childCount ?? item.defaultChildCount ?? 1;
    }
    onBatchMark(dateStr, status, notes, childCounts);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-stone-900/30 backdrop-blur-2xs p-0 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-md bg-white rounded-t-xl sm:rounded-xl p-4 max-h-[85vh] overflow-y-auto shadow-xl border border-stone-200 flex flex-col gap-3.5">
        {/* 头部日期信息 */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-stone-900">{formattedDate}</span>
            {dayInfo.isHoliday && (
              <span className="text-[10px] text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded font-medium border border-rose-100">
                {dayInfo.holidayName || '休假'}
              </span>
            )}
            {dayInfo.isCompensatoryWorkday && (
              <span className="text-[10px] text-amber-800 bg-amber-100/60 px-1.5 py-0.2 rounded font-medium border border-amber-200/60">
                调休
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-md hover:bg-stone-100 flex items-center justify-center text-stone-400 hover:text-stone-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 快捷批量按钮 */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleBatchAll('PRESENT')}
            className="py-1.5 px-3 rounded-lg bg-emerald-50/60 hover:bg-emerald-50 text-emerald-800 font-medium text-xs border border-emerald-200/60 transition-colors"
          >
            今日全勤
          </button>
          <button
            onClick={() => handleBatchAll('ABSENT', '请假未到')}
            className="py-1.5 px-3 rounded-lg bg-rose-50/60 hover:bg-rose-50 text-rose-700 font-medium text-xs border border-rose-200/60 transition-colors"
          >
            今日全部请假 (退费)
          </button>
        </div>

        {/* 项目清单 */}
        <div className="flex flex-col gap-2.5 my-1">
          {items.map((item) => {
            const currentRec = dayAttendanceMap[item.id];
            const isScheduled = isMatchingDayType(dayInfo, item.applicableDays);
            const isLegacyOffError = dayInfo.isCompensatoryWorkday && currentRec?.status === 'OFF' && !currentRec?.notes && isScheduled;
            const status: AttendanceStatus = isLegacyOffError
              ? 'PRESENT'
              : (currentRec?.status || (isScheduled ? 'PRESENT' : 'OFF'));
            const notes = currentRec?.notes;
            const childCount = currentRec?.childCount ?? item.defaultChildCount ?? 1;
            const isEditingThisNote = editingNotesItemId === item.id;

            const isMonth = item.billingType === 'PER_MONTH';
            const dayCost = (childCount * item.dayPrice).toFixed(1);
            const dayRefund = (childCount * item.refundPerDay).toFixed(1);

            return (
              <div
                key={item.id}
                className={cn(
                  'p-3 rounded-lg border transition-all flex flex-col gap-2',
                  status === 'PRESENT'
                    ? 'border-stone-200 bg-white'
                    : status === 'ABSENT'
                    ? 'border-rose-200 bg-rose-50/30'
                    : 'border-stone-100 bg-stone-50/60'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-md bg-amber-50 flex items-center justify-center text-amber-800">
                      <DynamicIcon name={item.icon} className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-stone-900 flex items-center gap-1.5">
                        <span>{item.name}</span>
                        {!isScheduled && (
                          <span className="text-[9px] text-stone-400 font-normal">
                            非排期
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-stone-400">
                        {isMonth
                          ? `包月 ¥${item.monthPrice}/人 · 缺勤退 ¥${item.refundPerDay}/人/天`
                          : `按天计费 ¥${item.dayPrice}/人/天`}
                      </div>
                    </div>
                  </div>

                  {/* 状态结算指示 */}
                  {status === 'ABSENT' && isMonth && (
                    <span className="text-xs font-medium text-rose-600">
                      -¥{dayRefund}
                    </span>
                  )}
                  {status === 'PRESENT' && !isMonth && (
                    <span className="text-xs font-medium text-stone-900">
                      ¥{dayCost}
                    </span>
                  )}
                </div>

                {/* 状态切换与人数调整 */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-stone-100">
                  <div className="grid grid-cols-3 gap-1 flex-1">
                    <button
                      onClick={() => handleStatusChange(item, 'PRESENT')}
                      className={cn(
                        'py-1 rounded-md text-xs font-medium transition-colors',
                        status === 'PRESENT'
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'bg-stone-50 hover:bg-stone-100 text-stone-600'
                      )}
                    >
                      出勤
                    </button>
                    <button
                      onClick={() => handleStatusChange(item, 'ABSENT')}
                      className={cn(
                        'py-1 rounded-md text-xs font-medium transition-colors',
                        status === 'ABSENT'
                          ? 'bg-rose-600 text-white shadow-2xs'
                          : 'bg-stone-50 hover:bg-rose-50 text-stone-600 hover:text-rose-600'
                      )}
                    >
                      请假
                    </button>
                    <button
                      onClick={() => handleStatusChange(item, 'OFF')}
                      className={cn(
                        'py-1 rounded-md text-xs font-medium transition-colors',
                        status === 'OFF'
                          ? 'bg-stone-500 text-white shadow-2xs'
                          : 'bg-stone-50 hover:bg-stone-100 text-stone-600'
                      )}
                    >
                      休息
                    </button>
                  </div>

                  {/* 孩子人数微调 */}
                  <div className="flex items-center gap-1 bg-stone-50 px-2 py-0.5 rounded-md text-[11px] text-stone-600 border border-stone-200/70">
                    <button
                      type="button"
                      onClick={() => handleChildCountChange(item, childCount - 1)}
                      disabled={childCount <= 1}
                      className="px-1 text-stone-400 hover:text-stone-700 disabled:opacity-30 font-bold"
                    >
                      -
                    </button>
                    <span className="font-medium px-1">{childCount}人</span>
                    <button
                      type="button"
                      onClick={() => handleChildCountChange(item, childCount + 1)}
                      className="px-1 text-stone-400 hover:text-stone-700 font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* 缺勤备注 */}
                {status === 'ABSENT' && (
                  <div className="pt-1.5 border-t border-rose-100">
                    {isEditingThisNote ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={tempNote}
                          onChange={(e) => setTempNote(e.target.value)}
                          placeholder="填写请假原因（对账可查）"
                          className="flex-1 text-xs px-2 py-1 rounded-md border border-stone-200 focus:outline-none focus:border-brand-500"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveNote(item)}
                          className="text-xs bg-brand-500 text-white px-2.5 py-1 rounded-md font-medium"
                        >
                          保存
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => handleOpenNote(item)}
                        className="flex items-center justify-between text-xs text-stone-500 py-0.5 cursor-pointer hover:text-stone-800"
                      >
                        <div className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3 text-stone-400" />
                          <span className={notes ? 'text-stone-700' : 'text-stone-400'}>
                            {notes || '添加请假原因'}
                          </span>
                        </div>
                        <Edit3 className="w-3 h-3 text-stone-400" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 完成按钮 */}
        <button
          onClick={onClose}
          className="w-full py-2 bg-brand-500 hover:bg-brand-600 text-white font-medium text-xs rounded-lg transition-colors mt-1 shadow-xs"
        >
          确定
        </button>
      </div>
    </div>
  );
}
