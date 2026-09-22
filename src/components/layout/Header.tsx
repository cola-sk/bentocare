'use client';

import { useState } from 'react';
import { Child } from '@/lib/types';
import { ChevronLeft, ChevronRight, Users, Calendar, Sparkles } from 'lucide-react';
import { format, addMonths, subMonths, parse } from 'date-fns';

interface HeaderProps {
  childrenList: Child[];
  currentChild: Child;
  onSelectChild: (id: string) => void;
  currentMonth: string; // YYYY-MM
  onMonthChange: (month: string) => void;
  showMonthNav?: boolean;
}

export function Header({
  childrenList,
  currentChild,
  onSelectChild,
  currentMonth,
  onMonthChange,
  showMonthNav = true,
}: HeaderProps) {
  const [showChildPicker, setShowChildPicker] = useState(false);

  const monthDate = parse(currentMonth, 'yyyy-MM', new Date());

  const handlePrevMonth = () => {
    const prev = subMonths(monthDate, 1);
    onMonthChange(format(prev, 'yyyy-MM'));
  };

  const handleNextMonth = () => {
    const next = addMonths(monthDate, 1);
    onMonthChange(format(next, 'yyyy-MM'));
  };

  const handleTodayMonth = () => {
    onMonthChange(format(new Date(), 'yyyy-MM'));
  };

  const monthFormatted = format(monthDate, 'yyyy年M月');
  const isCurrentMonth = currentMonth === format(new Date(), 'yyyy-MM');

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm pt-safe">
      <div className="max-w-md mx-auto px-4 py-3">
        {/* 第一行：品牌 & 孩子选择器 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-500 to-amber-400 flex items-center justify-center text-white shadow-sm font-bold text-base">
              🍱
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-800 text-base tracking-tight">伴学小账</span>
                <span className="text-[10px] font-semibold text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded-full">
                  BentoCare
                </span>
              </div>
            </div>
          </div>

          {/* 切换孩子按钮 */}
          <div className="relative">
            <button
              onClick={() => setShowChildPicker(!showChildPicker)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors text-slate-700 text-xs font-medium"
            >
              <span>{currentChild?.avatar || '👶'}</span>
              <span>{currentChild?.name || '选择孩子'}</span>
              <span className="text-slate-400 text-[10px]">▼</span>
            </button>

            {/* 孩子切换浮窗 */}
            {showChildPicker && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  切换孩子档案
                </div>
                {childrenList.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      onSelectChild(c.id);
                      setShowChildPicker(false);
                    }}
                    className={`w-full px-3 py-2 flex items-center justify-between text-left text-xs transition-colors ${
                      c.id === currentChild?.id
                        ? 'bg-brand-50 text-brand-600 font-semibold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{c.avatar || '👶'}</span>
                      <div>
                        <div>{c.name}</div>
                        <div className="text-[10px] text-slate-400 font-normal">{c.grade || '未分班'}</div>
                      </div>
                    </div>
                    {c.id === currentChild?.id && <span className="text-brand-500">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 第二行：月份切换控制器 */}
        {showMonthNav && (
          <div className="mt-2.5 flex items-center justify-between bg-slate-50 rounded-2xl p-1 border border-slate-100">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-xl hover:bg-white text-slate-600 transition-all active:scale-95"
              aria-label="上一月"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800">{monthFormatted}</span>
              {!isCurrentMonth && (
                <button
                  onClick={handleTodayMonth}
                  className="text-[10px] bg-brand-500 text-white font-medium px-2 py-0.5 rounded-full hover:bg-brand-600 transition-colors"
                >
                  回当月
                </button>
              )}
            </div>

            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-xl hover:bg-white text-slate-600 transition-all active:scale-95"
              aria-label="下一月"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
