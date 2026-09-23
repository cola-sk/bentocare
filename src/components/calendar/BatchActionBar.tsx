'use client';

import { MonthlyBillSummary } from '@/lib/types';
import { CalendarCheck2, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface BatchActionBarProps {
  summary: MonthlyBillSummary;
  onOpenToday: () => void;
  onOpenBills: () => void;
}

export function BatchActionBar({ summary, onOpenToday, onOpenBills }: BatchActionBarProps) {
  const todayStr = format(new Date(), 'M月d日 EEEE', { locale: zhCN });

  return (
    <div className="bg-white rounded-xl p-3.5 border border-stone-200/80 shadow-xs flex flex-col gap-3">
      {/* 今日快速打卡行 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-brand-600">
            <CalendarCheck2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-stone-900">
              今日考勤 · {summary.child.name}
            </div>
            <div className="text-[11px] text-stone-400">
              {todayStr}
            </div>
          </div>
        </div>

        <button
          onClick={onOpenToday}
          className="px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white font-medium text-xs rounded-lg transition-colors active:scale-95 shadow-xs"
        >
          立即打卡
        </button>
      </div>

      {/* 当月数据摘要分隔线 */}
      <div className="pt-2.5 border-t border-stone-100 flex items-center justify-between text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[11px] text-stone-400">缺勤应退</span>
            <span className="font-semibold text-rose-600">¥{summary.totalRefund}</span>
          </div>
          <div className="w-px h-3 bg-stone-200" />
          <div className="flex items-baseline gap-1.5">
            <span className="text-[11px] text-stone-400">实付净额</span>
            <span className="font-semibold text-stone-900">¥{summary.totalActualCost}</span>
          </div>
        </div>

        <button
          onClick={onOpenBills}
          className="flex items-center gap-0.5 text-[11px] text-brand-700 hover:text-brand-900 font-medium transition-colors"
        >
          <span>明细</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
