'use client';

import { useState } from 'react';
import { Child } from '@/lib/types';
import { ChevronLeft, ChevronRight, ChevronDown, Check, CalendarCheck2, LogOut } from 'lucide-react';
import { format, addMonths, subMonths, parse } from 'date-fns';
import { DynamicIcon } from '@/components/common/DynamicIcon';
import { useAuth } from '@/components/auth/AuthBoundary';

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
  const { user, signOut } = useAuth();

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
    <header className="sticky top-0 z-30 bg-[#faf9f6]/95 backdrop-blur-sm border-b border-stone-200/80 pt-safe">
      <div className="max-w-md mx-auto px-4 py-2.5">
        {/* 第一行：品牌 & 孩子选择器 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-500 flex items-center justify-center text-white shadow-xs">
              <CalendarCheck2 className="w-4 h-4 text-white" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-semibold text-stone-900 text-sm tracking-tight">伴学小账</span>
              <span className="text-[10px] text-amber-700/80 font-normal">BentoCare</span>
            </div>
          </div>

          {/* 切换孩子按钮 */}
          <div className="relative flex items-center gap-1">
            <button
              onClick={() => setShowChildPicker(!showChildPicker)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 transition-colors text-stone-700 text-xs font-medium"
            >
              <span className="w-4 h-4 rounded-md bg-stone-100 flex items-center justify-center text-stone-600">
                <DynamicIcon name={currentChild?.avatar || 'Smile'} className="w-3 h-3" />
              </span>
              <span>{currentChild?.name || '选择孩子'}</span>
              <ChevronDown className="w-3 h-3 text-stone-400" />
            </button>

            {/* 孩子切换浮窗 */}
            {showChildPicker && (
              <div className="absolute right-0 mt-1.5 w-44 bg-white rounded-xl shadow-lg border border-stone-200 py-1.5 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1 text-[10px] font-medium text-stone-400">
                  切换档案
                </div>
                {childrenList.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      onSelectChild(c.id);
                      setShowChildPicker(false);
                    }}
                    className={`w-full px-3 py-1.5 flex items-center justify-between text-left text-xs transition-colors ${
                      c.id === currentChild?.id
                        ? 'bg-amber-50/70 text-amber-900 font-semibold'
                        : 'text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-md bg-stone-100 flex items-center justify-center text-stone-600">
                        <DynamicIcon name={c.avatar || 'Smile'} className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div>{c.name}</div>
                        <div className="text-[10px] text-stone-400 font-normal">{c.grade || '未分班'}</div>
                      </div>
                    </div>
                    {c.id === currentChild?.id && <Check className="w-3.5 h-3.5 text-brand-600" />}
                  </button>
                ))}
              </div>
            )}
            <button onClick={() => void signOut()} className="p-1.5 text-stone-400 hover:text-stone-700" aria-label={`退出 ${user.displayName} 的账户`} title={`退出 ${user.displayName}`}>
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* 第二行：月份切换控制器 */}
        {showMonthNav && (
          <div className="mt-2 flex items-center justify-between bg-stone-100/80 rounded-lg px-1.5 py-1">
            <button
              onClick={handlePrevMonth}
              className="p-1 rounded-md hover:bg-white text-stone-500 hover:text-stone-800 transition-all active:scale-95"
              aria-label="上一月"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-stone-800 tracking-tight">{monthFormatted}</span>
              {!isCurrentMonth && (
                <button
                  onClick={handleTodayMonth}
                  className="text-[10px] text-brand-700 hover:text-brand-900 bg-white border border-stone-200 px-1.5 py-0.2 rounded-md font-medium transition-colors"
                >
                  当月
                </button>
              )}
            </div>

            <button
              onClick={handleNextMonth}
              className="p-1 rounded-md hover:bg-white text-stone-500 hover:text-stone-800 transition-all active:scale-95"
              aria-label="下一月"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
