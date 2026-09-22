'use client';

import { ItemMonthlyBill } from '@/lib/types';
import { CheckCircle2, AlertCircle, Info, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ItemBreakdownProps {
  itemBills: ItemMonthlyBill[];
}

export function ItemBreakdown({ itemBills }: ItemBreakdownProps) {
  if (itemBills.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-6 text-center text-slate-400 border border-slate-100">
        暂无托管项目数据，请在“配置中心”添加
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
        各项目费用与退费明细
      </div>

      {itemBills.map((ib) => {
        const { item } = ib;
        const isMonth = item.billingType === 'PER_MONTH';

        return (
          <div
            key={item.id}
            className="bg-white rounded-3xl p-4 shadow-card border border-slate-100 flex flex-col gap-3"
          >
            {/* 项目头部信息 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl p-1.5 bg-slate-50 rounded-2xl">{item.icon}</span>
                <div>
                  <div className="text-sm font-bold text-slate-800">{item.name}</div>
                  <div className="text-[11px] text-slate-400">
                    {isMonth
                      ? `包月标准 ¥${item.monthPrice} · ${
                          item.refundMode === 'FIXED'
                            ? `固定退 ¥${item.refundPerDay}/天`
                            : '按当月工作日均摊退费'
                        }`
                      : `按天计费 ¥${item.dayPrice}/天`}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-[10px] text-slate-400 font-medium">实付费用</div>
                <div className="text-base font-extrabold text-slate-800">
                  ¥{ib.actualUsedAmount}
                </div>
              </div>
            </div>

            {/* 考勤出勤/请假统计条 */}
            <div className="grid grid-cols-2 gap-2 bg-slate-50/80 rounded-2xl p-2.5 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span className="font-semibold">{ib.presentDays} 天出勤</span>
              </div>

              <div className="flex items-center gap-1.5 text-rose-700">
                <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                <span className="font-semibold">{ib.absentDays} 天请假缺勤</span>
              </div>
            </div>

            {/* 计费核算公式行 */}
            <div className="text-xs bg-brand-50/40 border border-brand-100/60 rounded-2xl p-2.5 text-slate-700">
              {isMonth ? (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">预付包月:</span>
                    <span className="font-semibold">¥{ib.prepaidAmount}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-rose-600 font-semibold">
                    <span>缺勤退费 ({ib.absentDays}天 × ¥{ib.effectiveRefundPerDay}):</span>
                    <span>-¥{ib.refundAmount}</span>
                  </div>
                  <div className="w-full h-[1px] bg-brand-200/50 my-0.5" />
                  <div className="flex items-center justify-between font-bold text-slate-800">
                    <span>净应付额:</span>
                    <span className="text-brand-600">¥{ib.actualUsedAmount}</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-[11px]">
                    按天累加 ({ib.presentDays}天 × ¥{item.dayPrice}/天):
                  </span>
                  <span className="font-bold text-slate-800">¥{ib.actualUsedAmount}</span>
                </div>
              )}
            </div>

            {/* 缺勤明细记录（带备注） */}
            {ib.absentDates.length > 0 && (
              <div className="border-t border-slate-100 pt-2.5">
                <div className="text-[11px] font-semibold text-rose-500 mb-1.5 flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  <span>请假退费日期明细:</span>
                </div>
                <div className="flex flex-col gap-1">
                  {ib.absentDates.map((ad) => (
                    <div
                      key={ad.date}
                      className="flex items-center justify-between text-[11px] bg-rose-50/50 px-2.5 py-1.5 rounded-xl border border-rose-100/60"
                    >
                      <span className="font-bold text-rose-700">{ad.date}</span>
                      <span className="text-slate-500">
                        {ad.notes ? `原因: ${ad.notes}` : '请假缺勤'}
                      </span>
                      <span className="font-semibold text-rose-600">
                        -¥{ib.effectiveRefundPerDay}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
