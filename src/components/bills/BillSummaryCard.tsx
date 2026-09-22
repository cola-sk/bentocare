'use client';

import { MonthlyBillSummary } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { Receipt, TrendingDown, Clock, ShieldCheck, Wallet } from 'lucide-react';
import { format, parse } from 'date-fns';

interface BillSummaryCardProps {
  summary: MonthlyBillSummary;
  onOpenPrepaidModal: () => void;
}

export function BillSummaryCard({ summary, onOpenPrepaidModal }: BillSummaryCardProps) {
  const monthDate = parse(summary.month, 'yyyy-MM', new Date());
  const monthTitle = format(monthDate, 'yyyy年M月');

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-5 shadow-xl relative overflow-hidden">
      {/* 背景光晕装饰 */}
      <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-brand-500/20 rounded-full blur-2xl" />
      <div className="absolute -left-8 -top-8 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl" />

      {/* 头部：标题与孩子信息 */}
      <div className="flex items-center justify-between relative z-10 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-brand-500/20 flex items-center justify-center text-brand-400">
            <Receipt className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-300">
              {monthTitle} · 托管对账单
            </div>
            <div className="text-sm font-extrabold text-white flex items-center gap-1.5">
              <span>{summary.child.name}</span>
              <span className="text-[10px] font-normal text-slate-400">
                (法定工作日: {summary.workdayCount}天)
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={onOpenPrepaidModal}
          className="text-[11px] bg-white/10 hover:bg-white/20 text-slate-200 px-2.5 py-1 rounded-full font-medium transition-colors backdrop-blur-sm"
        >
          调整预付款
        </button>
      </div>

      {/* 核心金额大屏 */}
      <div className="my-4 relative z-10">
        <div className="text-xs text-slate-400 font-medium">当月实际应付净额 (实耗)</div>
        <div className="text-3xl font-black text-brand-400 mt-1 tracking-tight">
          ¥{summary.totalActualCost.toFixed(2)}
        </div>
      </div>

      {/* 三列结算明细矩阵 */}
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/10 relative z-10 text-center">
        <div className="bg-white/5 rounded-2xl p-2.5">
          <div className="text-[10px] text-slate-400">预付总额</div>
          <div className="text-sm font-bold text-white mt-0.5">
            ¥{summary.totalPrepaid.toFixed(0)}
          </div>
        </div>

        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-2.5">
          <div className="text-[10px] text-rose-300 font-medium flex items-center justify-center gap-0.5">
            <TrendingDown className="w-2.5 h-2.5" />
            <span>缺勤应退</span>
          </div>
          <div className="text-sm font-extrabold text-rose-400 mt-0.5">
            -¥{summary.totalRefund.toFixed(0)}
          </div>
        </div>

        <div className="bg-white/5 rounded-2xl p-2.5">
          <div className="text-[10px] text-slate-400">按天计费</div>
          <div className="text-sm font-bold text-amber-300 mt-0.5">
            +¥{summary.totalPerDayCost.toFixed(0)}
          </div>
        </div>
      </div>

      {/* 结算结余提示 */}
      <div className="mt-3 bg-brand-500/15 border border-brand-500/30 rounded-2xl px-3.5 py-2.5 flex items-center justify-between text-xs relative z-10">
        <div className="flex items-center gap-1.5 text-brand-300 font-medium">
          <Wallet className="w-3.5 h-3.5" />
          <span>预付核销后结余</span>
        </div>
        <div className="font-extrabold text-white">
          {summary.finalBalance > 0 ? (
            <span className="text-emerald-400 font-bold">应退还家长 ¥{summary.finalBalance}</span>
          ) : summary.finalBalance < 0 ? (
            <span className="text-rose-400 font-bold">需补缴 ¥{Math.abs(summary.finalBalance)}</span>
          ) : (
            <span className="text-slate-300">完全结清</span>
          )}
        </div>
      </div>
    </div>
  );
}
