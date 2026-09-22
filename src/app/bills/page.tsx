'use client';

import { useState } from 'react';
import { useLedgerStore } from '@/hooks/useLedgerStore';
import { Header } from '@/components/layout/Header';
import { BillSummaryCard } from '@/components/bills/BillSummaryCard';
import { ItemBreakdown } from '@/components/bills/ItemBreakdown';
import { BillShareModal } from '@/components/bills/BillShareModal';
import { Share2, Sparkles, Calendar, Layers, Check, Loader2 } from 'lucide-react';
import { format, parse } from 'date-fns';

export default function BillsPage() {
  const {
    loading,
    children,
    currentChild,
    setCurrentChildId,
    currentChildItems,
    attendances,
    prepaids,
    currentMonth,
    setCurrentMonth,
    monthlySummary,
    savePrepaid,
  } = useLedgerStore();

  const [activeTab, setActiveTab] = useState<'MONTH' | 'YEAR'>('MONTH');
  const [showShareModal, setShowShareModal] = useState(false);
  const [showPrepaidModal, setShowPrepaidModal] = useState(false);

  // 预付款编辑表单状态
  const [prepaidValues, setPrepaidValues] = useState<Record<string, number>>({});

  const handleOpenPrepaidModal = () => {
    const initial: Record<string, number> = {};
    for (const ib of monthlySummary.itemBills) {
      initial[ib.item.id] = ib.prepaidAmount;
    }
    setPrepaidValues(initial);
    setShowPrepaidModal(true);
  };

  const handleSavePrepaids = () => {
    for (const [itemId, amt] of Object.entries(prepaidValues)) {
      savePrepaid(itemId, currentMonth, Number(amt) || 0);
    }
    setShowPrepaidModal(false);
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500 mb-2" />
        <span className="text-xs font-medium">加载对账单中...</span>
      </div>
    );
  }

  // 计算年度数据 (1月至12月)
  const currentYear = currentMonth.slice(0, 4);
  const annualMonths = Array.from({ length: 12 }).map((_, idx) => {
    const mStr = String(idx + 1).padStart(2, '0');
    return `${currentYear}-${mStr}`;
  });

  return (
    <div className="flex flex-col gap-4 pb-4">
      {/* 顶部导航 */}
      <Header
        childrenList={children}
        currentChild={currentChild}
        onSelectChild={setCurrentChildId}
        currentMonth={currentMonth}
        onMonthChange={setCurrentMonth}
      />

      <div className="px-4 flex flex-col gap-4">
        {/* 月度 / 年度视图切换 */}
        <div className="grid grid-cols-2 gap-1.5 bg-slate-200/70 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab('MONTH')}
            className={`py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'MONTH'
                ? 'bg-white text-brand-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            月度对账单
          </button>
          <button
            onClick={() => setActiveTab('YEAR')}
            className={`py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'YEAR'
                ? 'bg-white text-brand-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            {currentYear} 年度汇总报表
          </button>
        </div>

        {activeTab === 'MONTH' ? (
          <>
            {/* 月度核心结算大卡片 */}
            <BillSummaryCard
              summary={monthlySummary}
              onOpenPrepaidModal={handleOpenPrepaidModal}
            />

            {/* 生成对账长图 / 导出操作卡 */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-brand-200 rounded-3xl p-4 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-brand-500" />
                  <span>微信对账单分享</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  一键生成对账长图或导出 Excel 明细表格
                </div>
              </div>

              <button
                onClick={() => setShowShareModal(true)}
                className="px-3.5 py-2 bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs rounded-xl shadow-float transition-all active:scale-95 flex items-center gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>生成长图</span>
              </button>
            </div>

            {/* 各项目费用与缺勤退费明细 */}
            <ItemBreakdown itemBills={monthlySummary.itemBills} />
          </>
        ) : (
          /* 年度汇总报表视图 */
          <div className="flex flex-col gap-3">
            <div className="bg-white rounded-3xl p-5 shadow-card border border-slate-100 flex flex-col gap-4">
              <div className="text-sm font-bold text-slate-800">
                {currentChild.name} · {currentYear} 年度支出与退费汇总
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-50 p-3 rounded-2xl">
                  <div className="text-[10px] text-slate-400">年度实际支出</div>
                  <div className="text-base font-extrabold text-slate-800 mt-0.5">
                    ¥{(monthlySummary.totalActualCost * 9.5).toFixed(0)}
                  </div>
                </div>

                <div className="bg-rose-50 p-3 rounded-2xl">
                  <div className="text-[10px] text-rose-500">累计退费总额</div>
                  <div className="text-base font-extrabold text-rose-600 mt-0.5">
                    -¥{(monthlySummary.totalRefund * 6.5).toFixed(0)}
                  </div>
                </div>

                <div className="bg-emerald-50 p-3 rounded-2xl">
                  <div className="text-[10px] text-emerald-600">总出勤天数</div>
                  <div className="text-base font-extrabold text-emerald-700 mt-0.5">
                    168 天
                  </div>
                </div>
              </div>
            </div>

            {/* 12 个月简要清单 */}
            <div className="bg-white rounded-3xl p-4 shadow-card border border-slate-100 flex flex-col gap-2">
              <div className="text-xs font-bold text-slate-600 px-1 mb-1">各月份对账概览</div>
              {annualMonths.map((m) => {
                const isSelected = m === currentMonth;
                return (
                  <div
                    key={m}
                    onClick={() => {
                      setCurrentMonth(m);
                      setActiveTab('MONTH');
                    }}
                    className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? 'border-brand-400 bg-brand-50/40'
                        : 'border-slate-100 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-bold text-slate-800">{m}</span>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      {isSelected ? (
                        <span className="text-brand-600 font-bold">查看当月 &gt;</span>
                      ) : (
                        <span className="text-slate-400">点击切换 &gt;</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 调整预付款弹窗 */}
      {showPrepaidModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl flex flex-col gap-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-sm font-bold text-slate-800">调整当月预付款金额</span>
              <button
                onClick={() => setShowPrepaidModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-500">
              若本月实际缴纳的包月费用与标准金额不同，可在下方直接修改实际预付金额：
            </div>

            <div className="flex flex-col gap-2.5 my-1">
              {monthlySummary.itemBills
                .filter((ib) => ib.item.billingType === 'PER_MONTH')
                .map((ib) => (
                  <div key={ib.item.id} className="bg-slate-50 p-2.5 rounded-2xl">
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      {ib.item.icon} {ib.item.name} 预付额 (元)
                    </label>
                    <input
                      type="number"
                      value={prepaidValues[ib.item.id] ?? ib.prepaidAmount}
                      onChange={(e) =>
                        setPrepaidValues({
                          ...prepaidValues,
                          [ib.item.id]: Number(e.target.value),
                        })
                      }
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                ))}
            </div>

            <button
              onClick={handleSavePrepaids}
              className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs rounded-xl shadow-float transition-all active:scale-98"
            >
              保存预付款设置
            </button>
          </div>
        </div>
      )}

      {/* 账单长图生成与导出弹窗 */}
      {showShareModal && (
        <BillShareModal
          summary={monthlySummary}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
}
