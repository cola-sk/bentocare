'use client';

import { MonthlyBillSummary, AttendanceStatus } from '@/lib/types';
import { Sparkles, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface BatchActionBarProps {
  summary: MonthlyBillSummary;
  onOpenToday: () => void;
  onOpenBills: () => void;
}

export function BatchActionBar({ summary, onOpenToday, onOpenBills }: BatchActionBarProps) {
  const todayStr = format(new Date(), 'M月d日 EEEE', { locale: zhCN });

  // 统计当月总出勤与请假次数
  let totalPresentCount = 0;
  let totalAbsentCount = 0;
  for (const itemBill of summary.itemBills) {
    totalPresentCount += itemBill.presentDays;
    totalAbsentCount += itemBill.absentDays;
  }

  return (
    <div className="flex flex-col gap-3">
      {/* 今日打卡快速条 */}
      <div className="bg-gradient-to-r from-brand-500 to-amber-500 rounded-3xl p-4 text-white shadow-card flex items-center justify-between">
        <div>
          <div className="text-[11px] font-medium text-amber-100 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>今日打卡 · {todayStr}</span>
          </div>
          <div className="text-base font-extrabold mt-0.5 tracking-tight">
            {summary.child.name} 今日考勤记录
          </div>
        </div>

        <button
          onClick={onOpenToday}
          className="px-3.5 py-2 bg-white text-brand-600 font-bold text-xs rounded-xl shadow-sm hover:bg-amber-50 active:scale-95 transition-all flex items-center gap-1"
        >
          <span>立即打卡</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 本月快速对账微卡 */}
      <div
        onClick={onOpenBills}
        className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-subtle flex items-center justify-between cursor-pointer hover:border-brand-200 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-[11px] text-slate-400 font-medium">当月缺勤退费</span>
            <span className="text-base font-extrabold text-rose-500">
              ¥{summary.totalRefund}
            </span>
          </div>
          <div className="w-[1px] h-6 bg-slate-100" />
          <div className="flex flex-col">
            <span className="text-[11px] text-slate-400 font-medium">实际应付净额</span>
            <span className="text-base font-extrabold text-slate-800">
              ¥{summary.totalActualCost}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs text-brand-600 font-semibold">
          <span>查看明细</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
}
