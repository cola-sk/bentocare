'use client';

import { useState } from 'react';
import { ItemMonthlyBill } from '@/lib/types';
import { DynamicIcon } from '@/components/common/DynamicIcon';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ItemBreakdownProps {
  itemBills: ItemMonthlyBill[];
}

const formatDaysType = (days?: string[]) => {
  const list = days && days.length > 0 ? days : ['WORKDAY'];
  const labels: string[] = [];
  if (list.includes('WORKDAY')) labels.push('工作日');
  if (list.includes('WEEKEND')) labels.push('周末');
  if (list.includes('HOLIDAY')) labels.push('节假日');
  return labels.join('+');
};

function ItemBillCard({ ib }: { ib: ItemMonthlyBill }) {
  // 请假消费记录默认折叠
  const [isAbsentExpanded, setIsAbsentExpanded] = useState(false);
  const { item } = ib;
  const isMonth = item.billingType === 'PER_MONTH';
  const daysLabel = formatDaysType(ib.applicableDays);

  return (
    <div className="bg-white rounded-xl p-3.5 border border-stone-200/80 shadow-xs flex flex-col gap-2.5">
      {/* 项目头部信息 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-amber-50 flex items-center justify-center text-amber-800">
            <DynamicIcon name={item.icon} className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-stone-900 flex items-center gap-1.5 flex-wrap">
              <span>{item.name}</span>
              <span className="text-[10px] text-stone-600 bg-stone-100 px-1.5 py-0.2 rounded font-normal">
                {ib.defaultChildCount || 1}人
              </span>
              <span className="text-[10px] text-stone-600 bg-stone-100 px-1.5 py-0.2 rounded font-normal">
                {daysLabel}
              </span>
            </div>
            <div className="text-[10px] text-stone-400 mt-0.5">
              {isMonth
                ? (() => {
                    if (item.refundMode === 'FIXED') {
                      return `包月 ¥${item.monthPrice}/人 · 固定退 ¥${item.refundPerDay}/人/天`;
                    }
                    if (item.refundMode === 'FIXED_DAYS_DIVIDED') {
                      return `包月 ¥${item.monthPrice}/人 · 固定${item.refundFixedDays || 22}天折算(¥${ib.effectiveRefundPerDay}/人/天)`;
                    }
                    if (item.refundMode === 'CALENDAR_DIVIDED') {
                      return `包月 ¥${item.monthPrice}/人 · 自然天数折算(¥${ib.effectiveRefundPerDay}/人/天)`;
                    }
                    return `包月 ¥${item.monthPrice}/人 · 实际工作日(${ib.calculatedDaysCount}天)折算(¥${ib.effectiveRefundPerDay}/人/天)`;
                  })()
                : `按天计费 ¥${item.dayPrice}/人/天`}
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-[10px] text-stone-400">实付</div>
          <div className="text-sm font-semibold text-stone-900">
            ¥{ib.actualUsedAmount}
          </div>
        </div>
      </div>

      {/* 考勤统计条 */}
      <div className="flex items-center justify-between text-[11px] bg-stone-50 px-2.5 py-1.5 rounded-md text-stone-600">
        <div>
          出勤 <span className="font-semibold text-stone-900">{ib.presentDays}</span> 天
          <span className="text-stone-400 text-[10px] ml-1">({ib.presentPersonDays}人天)</span>
        </div>
        <div>
          请假 <span className="font-semibold text-rose-600">{ib.absentDays}</span> 天
          <span className="text-stone-400 text-[10px] ml-1">({ib.absentPersonDays}人天)</span>
        </div>
      </div>

      {/* 计费核算公式 */}
      <div className="text-xs bg-stone-50 border border-stone-100 rounded-md p-2 text-stone-600">
        {isMonth ? (
          <div className="flex flex-col gap-1 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-stone-400">预付包月:</span>
              <span>¥{ib.prepaidAmount}</span>
            </div>
            <div className="flex items-center justify-between text-rose-600">
              <span>
                缺勤退费 ({ib.absentPersonDays}人天 × ¥{ib.effectiveRefundPerDay}
                {item.refundMode === 'FIXED_DAYS_DIVIDED' ? ` · 固定${item.refundFixedDays || 22}天折算` : ''}
                {item.refundMode === 'WORKDAY_DIVIDED' ? ` · ${ib.calculatedDaysCount}天工作日折算` : ''}
                {item.refundMode === 'CALENDAR_DIVIDED' ? ` · 自然天数折算` : ''}
                ):
              </span>
              <span>-¥{ib.refundAmount}</span>
            </div>
            <div className="w-full h-px bg-stone-200/70 my-0.5" />
            <div className="flex items-center justify-between font-semibold text-stone-800">
              <span>净应付额:</span>
              <span className="text-brand-700">¥{ib.actualUsedAmount}</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-stone-400">按天累加 ({ib.presentPersonDays}人天 × ¥{item.dayPrice}):</span>
            <span className="font-semibold text-stone-900">¥{ib.actualUsedAmount}</span>
          </div>
        )}
      </div>

      {/* 缺勤明细记录（默认折叠） */}
      {ib.absentDates.length > 0 && (
        <div className="pt-1.5 border-t border-stone-100 flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => setIsAbsentExpanded((prev) => !prev)}
            className="w-full flex items-center justify-between text-[11px] text-stone-500 hover:text-stone-800 transition-colors py-0.5 rounded px-1 -mx-1 hover:bg-stone-50"
          >
            <span className="flex items-center gap-1.5 font-medium">
              <span className="text-stone-700">请假消费记录</span>
              <span className="text-[10px] text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded font-normal">
                共 {ib.absentDates.length} 天 · 退 -¥{ib.refundAmount}
              </span>
            </span>
            <span className="flex items-center gap-0.5 text-[10px] text-stone-400">
              <span>{isAbsentExpanded ? '收起' : '展开明细'}</span>
              {isAbsentExpanded ? <ChevronUp className="w-3 h-3 text-stone-400" /> : <ChevronDown className="w-3 h-3 text-stone-400" />}
            </span>
          </button>

          {isAbsentExpanded && (
            <div className="flex flex-col gap-1 pt-0.5 animate-in fade-in duration-150">
              {ib.absentDates.map((ad) => {
                const cCount = ad.childCount || 1;
                const refundVal = ad.refund ?? (cCount * ib.effectiveRefundPerDay);
                return (
                  <div
                    key={ad.date}
                    className="flex items-center justify-between text-[11px] text-stone-600 bg-rose-50/40 px-2 py-1 rounded"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-stone-800">{ad.date}</span>
                      <span className="text-[10px] text-stone-400">({cCount}人)</span>
                      {ad.notes && <span className="text-stone-500">· {ad.notes}</span>}
                    </div>
                    <span className="font-medium text-rose-600">-¥{refundVal}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ItemBreakdown({ itemBills }: ItemBreakdownProps) {
  if (itemBills.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 text-center text-stone-400 text-xs border border-stone-200/80">
        暂无托管项目数据，请在配置中心添加
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div className="text-[11px] font-medium text-stone-400 px-1">
        项目明细
      </div>

      {itemBills.map((ib) => (
        <ItemBillCard key={ib.item.id} ib={ib} />
      ))}
    </div>
  );
}

