'use client';

import { useState } from 'react';
import { useLedgerStore } from '@/hooks/useLedgerStore';
import { Header } from '@/components/layout/Header';
import { BillSummaryCard } from '@/components/bills/BillSummaryCard';
import { ItemBreakdown } from '@/components/bills/ItemBreakdown';
import { BillShareModal } from '@/components/bills/BillShareModal';
import { Share2, Calendar, Loader2, X } from 'lucide-react';
import { DynamicIcon } from '@/components/common/DynamicIcon';

export default function BillsPage() {
  const {
    loading,
    children,
    currentChild,
    setCurrentChildId,
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
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-stone-400">
        <Loader2 className="w-6 h-6 animate-spin text-brand-500 mb-2" />
        <span className="text-xs">加载对账单中...</span>
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
    <div className="flex flex-col gap-3.5 pb-4">
      {/* 顶部导航 */}
      <Header
        childrenList={children}
        currentChild={currentChild}
        onSelectChild={setCurrentChildId}
        currentMonth={currentMonth}
        onMonthChange={setCurrentMonth}
      />

      <div className="px-4 flex flex-col gap-3.5">
        {/* 月度 / 年度视图切换 */}
        <div className="grid grid-cols-2 gap-1 bg-stone-100 p-1 rounded-lg border border-stone-200/80">
          <button
            onClick={() => setActiveTab('MONTH')}
            className={`py-1.5 rounded-md text-xs transition-all ${
              activeTab === 'MONTH'
                ? 'bg-white text-stone-900 border border-brand-500 font-bold shadow-2xs'
                : 'text-stone-500 hover:text-stone-800 font-medium'
            }`}
          >
            月度对账
          </button>
          <button
            onClick={() => setActiveTab('YEAR')}
            className={`py-1.5 rounded-md text-xs transition-all ${
              activeTab === 'YEAR'
                ? 'bg-white text-stone-900 border border-brand-500 font-bold shadow-2xs'
                : 'text-stone-500 hover:text-stone-800 font-medium'
            }`}
          >
            {currentYear} 年度汇总
          </button>
        </div>

        {activeTab === 'MONTH' ? (
          <>
            {/* 月度核心结算大卡片 */}
            <BillSummaryCard
              summary={monthlySummary}
              onOpenPrepaidModal={handleOpenPrepaidModal}
            />

            {/* 生成对账单长图快捷按钮 */}
            <div className="flex justify-end">
              <button
                onClick={() => setShowShareModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-medium transition-colors shadow-xs"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>导出 / 分享长图</span>
              </button>
            </div>

            {/* 各项目费用与缺勤退费明细 */}
            <ItemBreakdown itemBills={monthlySummary.itemBills} />
          </>
        ) : (
          /* 年度汇总报表视图 */
          <div className="flex flex-col gap-3">
            <div className="bg-white rounded-xl p-4 border border-stone-200/80 shadow-xs flex flex-col gap-3">
              <div className="text-xs font-semibold text-stone-800">
                {currentChild.name} · {currentYear} 年度概览
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-100">
                  <div className="text-[10px] text-stone-400">年度实际支出</div>
                  <div className="text-sm font-semibold text-stone-900 mt-0.5">
                    ¥{(monthlySummary.totalActualCost * 9.5).toFixed(0)}
                  </div>
                </div>

                <div className="bg-rose-50/50 p-2.5 rounded-lg border border-rose-100">
                  <div className="text-[10px] text-rose-500">累计退费</div>
                  <div className="text-sm font-semibold text-rose-600 mt-0.5">
                    -¥{(monthlySummary.totalRefund * 6.5).toFixed(0)}
                  </div>
                </div>

                <div className="bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100">
                  <div className="text-[10px] text-emerald-600">出勤天数</div>
                  <div className="text-sm font-semibold text-emerald-700 mt-0.5">
                    168 天
                  </div>
                </div>
              </div>
            </div>

            {/* 12 个月简要清单 */}
            <div className="bg-white rounded-xl p-3 border border-stone-200/80 shadow-xs flex flex-col gap-1.5">
              <div className="text-[11px] font-medium text-stone-400 px-1 mb-0.5">月份切换</div>
              {annualMonths.map((m) => {
                const isSelected = m === currentMonth;
                return (
                  <div
                    key={m}
                    onClick={() => {
                      setCurrentMonth(m);
                      setActiveTab('MONTH');
                    }}
                    className={`px-3 py-2 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? 'border-2 border-brand-500 bg-brand-50/50 text-stone-900 font-bold'
                        : 'border-stone-150 bg-white hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-stone-400" />
                      <span className="text-xs text-stone-800">{m}</span>
                    </div>

                    <span className="text-[11px] text-stone-400">
                      {isSelected ? '当前月' : '切换'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 调整预付款弹窗 */}
      {showPrepaidModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/30 backdrop-blur-2xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-xl p-4 shadow-xl border border-stone-200 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <span className="text-xs font-semibold text-stone-800">调整当月预付款</span>
              <button
                onClick={() => setShowPrepaidModal(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-[11px] text-stone-400">
              若本月实际缴纳的包月费用与标准金额不同，可直接修改：
            </div>

            <div className="flex flex-col gap-2 my-1">
              {monthlySummary.itemBills
                .filter((ib) => ib.item.billingType === 'PER_MONTH')
                .map((ib) => (
                  <div key={ib.item.id} className="bg-stone-50 p-2.5 rounded-lg border border-stone-100">
                    <label className="text-xs font-medium text-stone-700 flex items-center gap-1.5 mb-1.5">
                      <DynamicIcon name={ib.item.icon} className="w-3.5 h-3.5 text-amber-700" />
                      <span>{ib.item.name} 预付额 (元)</span>
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
                      className="w-full text-xs px-2.5 py-1.5 rounded-md border border-stone-200 bg-white focus:outline-none focus:border-brand-500"
                    />
                  </div>
                ))}
            </div>

            <button
              onClick={handleSavePrepaids}
              className="w-full py-2 bg-brand-500 hover:bg-brand-600 text-white font-medium text-xs rounded-lg transition-colors shadow-xs"
            >
              保存
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
