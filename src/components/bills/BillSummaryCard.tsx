'use client';

import { MonthlyBillSummary } from '@/lib/types';
import { format, parse } from 'date-fns';
import { Receipt, SlidersHorizontal } from 'lucide-react';

interface BillSummaryCardProps {
  summary: MonthlyBillSummary;
  onOpenPrepaidModal: () => void;
}

export function BillSummaryCard({ summary, onOpenPrepaidModal }: BillSummaryCardProps) {
  const monthDate = parse(summary.month, 'yyyy-MM', new Date());
  const monthTitle = format(monthDate, 'yyyy年M月');

  return (
    <div className="bg-white rounded-xl p-4 border border-stone-200/80 shadow-xs flex flex-col gap-3.5">
      {/* 头部：标题与预付款调整入口 */}
      <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-amber-50 flex items-center justify-center text-brand-600">
            <Receipt className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-stone-900">
              {monthTitle} 对账单
            </div>
            <div className="text-[11px] text-stone-400">
              {summary.child.name} · 工作日 {summary.workdayCount} 天
            </div>
          </div>
        </div>

        <button
          onClick={onOpenPrepaidModal}
          className="flex items-center gap-1 text-[11px] text-stone-600 hover:text-stone-900 bg-stone-50 hover:bg-stone-100 px-2 py-1 rounded-md border border-stone-200/70 transition-colors"
        >
          <SlidersHorizontal className="w-3 h-3 text-stone-500" />
          <span>调整预付</span>
        </button>
      </div>

      {/* 核心金额展示 */}
      <div>
        <div className="text-[11px] text-stone-400 font-medium">当月实际应付净额 (实耗)</div>
        <div className="text-2xl font-bold text-stone-900 mt-0.5 tracking-tight">
          ¥{summary.totalActualCost.toFixed(2)}
        </div>
      </div>

      {/* 三列结算明细矩阵 */}
      <div className="grid grid-cols-3 gap-2 py-2.5 px-3 bg-stone-50/80 rounded-lg border border-stone-100 text-center">
        <div>
          <div className="text-[10px] text-stone-400">预付总额</div>
          <div className="text-xs font-semibold text-stone-800 mt-0.5">
            ¥{summary.totalPrepaid.toFixed(0)}
          </div>
        </div>

        <div className="border-x border-stone-200/70">
          <div className="text-[10px] text-stone-400">缺勤应退</div>
          <div className="text-xs font-semibold text-rose-600 mt-0.5">
            -¥{summary.totalRefund.toFixed(0)}
          </div>
        </div>

        <div>
          <div className="text-[10px] text-stone-400">按天计费</div>
          <div className="text-xs font-semibold text-stone-800 mt-0.5">
            +¥{summary.totalPerDayCost.toFixed(0)}
          </div>
        </div>
      </div>

      {/* 结算结余提示 */}
      <div className="flex items-center justify-between text-xs px-1">
        <span className="text-stone-400 text-[11px]">预付核销结余</span>
        <div className="font-medium text-xs">
          {summary.finalBalance > 0 ? (
            <span className="text-emerald-700">应退还家长 ¥{summary.finalBalance}</span>
          ) : summary.finalBalance < 0 ? (
            <span className="text-rose-600">需补缴 ¥{Math.abs(summary.finalBalance)}</span>
          ) : (
            <span className="text-stone-500">已结清</span>
          )}
        </div>
      </div>
    </div>
  );
}
