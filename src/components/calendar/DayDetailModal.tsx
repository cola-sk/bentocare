'use client';

import { useState } from 'react';
import { ServiceItem, AttendanceRecord, AttendanceStatus } from '@/lib/types';
import { format, parse, getDay } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Check, X, Coffee, Edit3, MessageSquareText, ShieldAlert } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import confetti from 'canvas-confetti';

interface DayDetailModalProps {
  dateStr: string; // YYYY-MM-DD
  items: ServiceItem[];
  attendances: AttendanceRecord[];
  onUpdateAttendance: (itemId: string, date: string, status: AttendanceStatus, notes?: string) => void;
  onBatchMark: (date: string, status: AttendanceStatus, notes?: string) => void;
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
  const dayOfWeek = getDay(dateObj);
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  // 临时备注输入状态
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
    onUpdateAttendance(item.id, dateStr, newStatus, current?.notes);
    if (newStatus === 'PRESENT') {
      // 触发微小粒子反馈
      confetti({
        particleCount: 20,
        spread: 40,
        origin: { y: 0.8 },
      });
    }
  };

  const handleOpenNote = (item: ServiceItem) => {
    const current = dayAttendanceMap[item.id];
    setTempNote(current?.notes || '');
    setEditingNotesItemId(item.id);
  };

  const handleSaveNote = (item: ServiceItem) => {
    const current = dayAttendanceMap[item.id];
    const status = current?.status || (isWeekend ? 'OFF' : 'PRESENT');
    onUpdateAttendance(item.id, dateStr, status, tempNote);
    setEditingNotesItemId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 max-h-[85vh] overflow-y-auto shadow-2xl border border-slate-100 flex flex-col gap-4 animate-in slide-in-from-bottom-6">
        {/* 头部日期信息 */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-slate-800">{formattedDate}</span>
              {isWeekend && (
                <span className="text-[10px] bg-rose-50 text-rose-500 font-semibold px-2 py-0.5 rounded-full">
                  周末
                </span>
              )}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">点击下方切换各项出勤状态或填写请假原因</div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* 快捷批量按钮 */}
        <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1.5 rounded-2xl">
          <button
            onClick={() => {
              onBatchMark(dateStr, 'PRESENT');
              confetti({ particleCount: 30, spread: 60 });
            }}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white hover:bg-emerald-50 text-emerald-600 font-semibold text-xs border border-emerald-100 shadow-sm transition-transform active:scale-95"
          >
            <Check className="w-3.5 h-3.5" />
            <span>今日全部出勤</span>
          </button>
          <button
            onClick={() => onBatchMark(dateStr, 'ABSENT', '请假未到')}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white hover:bg-rose-50 text-rose-600 font-semibold text-xs border border-rose-100 shadow-sm transition-transform active:scale-95"
          >
            <X className="w-3.5 h-3.5" />
            <span>今日全部请假 (退费)</span>
          </button>
        </div>

        {/* 项目清单与状态切换 */}
        <div className="flex flex-col gap-3 my-1">
          {items.map((item) => {
            const currentRec = dayAttendanceMap[item.id];
            const status: AttendanceStatus = currentRec?.status || (isWeekend ? 'OFF' : 'PRESENT');
            const notes = currentRec?.notes;
            const isEditingThisNote = editingNotesItemId === item.id;

            return (
              <div
                key={item.id}
                className={cn(
                  'p-3.5 rounded-2xl border transition-all duration-200',
                  status === 'PRESENT'
                    ? 'border-emerald-100 bg-emerald-50/30'
                    : status === 'ABSENT'
                    ? 'border-rose-200 bg-rose-50/40'
                    : 'border-slate-100 bg-slate-50/50'
                )}
              >
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xl p-1 bg-white rounded-xl shadow-xs">{item.icon}</span>
                    <div>
                      <div className="text-sm font-bold text-slate-800">{item.name}</div>
                      <div className="text-[11px] text-slate-400">
                        {item.billingType === 'PER_MONTH'
                          ? `包月 ¥${item.monthPrice} · 缺勤退 ¥${item.refundPerDay}/天`
                          : `按天计费 ¥${item.dayPrice}/天`}
                      </div>
                    </div>
                  </div>

                  {status === 'ABSENT' && item.billingType === 'PER_MONTH' && (
                    <span className="text-xs font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded-lg">
                      -¥{item.refundPerDay} 退费
                    </span>
                  )}
                </div>

                {/* 状态切换按钮群 */}
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => handleStatusChange(item, 'PRESENT')}
                    className={cn(
                      'py-1.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all',
                      status === 'PRESENT'
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'bg-white text-slate-600 hover:bg-emerald-50 border border-slate-200'
                    )}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>出勤</span>
                  </button>

                  <button
                    onClick={() => handleStatusChange(item, 'ABSENT')}
                    className={cn(
                      'py-1.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all',
                      status === 'ABSENT'
                        ? 'bg-rose-500 text-white shadow-sm'
                        : 'bg-white text-slate-600 hover:bg-rose-50 border border-slate-200'
                    )}
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>请假 (退费)</span>
                  </button>

                  <button
                    onClick={() => handleStatusChange(item, 'OFF')}
                    className={cn(
                      'py-1.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all',
                      status === 'OFF'
                        ? 'bg-slate-500 text-white shadow-sm'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    )}
                  >
                    <Coffee className="w-3.5 h-3.5" />
                    <span>休息/无</span>
                  </button>
                </div>

                {/* 缺勤原因备注区域 */}
                {status === 'ABSENT' && (
                  <div className="mt-2.5 pt-2 border-t border-rose-100/80">
                    {isEditingThisNote ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={tempNote}
                          onChange={(e) => setTempNote(e.target.value)}
                          placeholder="填写请假原因（如发烧、学校秋游等）"
                          className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveNote(item)}
                          className="text-xs bg-brand-500 text-white font-medium px-2.5 py-1.5 rounded-lg"
                        >
                          保存
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => handleOpenNote(item)}
                        className="flex items-center justify-between text-xs text-slate-600 bg-white/70 p-2 rounded-lg cursor-pointer hover:bg-white"
                      >
                        <div className="flex items-center gap-1.5">
                          <MessageSquareText className="w-3.5 h-3.5 text-slate-400" />
                          <span className={notes ? 'text-slate-700' : 'text-slate-400 italic'}>
                            {notes || '点击添加请假原因（对账可查）'}
                          </span>
                        </div>
                        <Edit3 className="w-3 h-3 text-slate-400" />
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
          className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-2xl shadow-float transition-all active:scale-98"
        >
          完成并保存
        </button>
      </div>
    </div>
  );
}
