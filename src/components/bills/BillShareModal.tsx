'use client';

import { useRef, useState } from 'react';
import { MonthlyBillSummary } from '@/lib/types';
import { toPng } from 'html-to-image';
import { Download, FileSpreadsheet, X, Check, Image as ImageIcon } from 'lucide-react';
import { format, parse } from 'date-fns';
import { DynamicIcon } from '@/components/common/DynamicIcon';

interface BillShareModalProps {
  summary: MonthlyBillSummary;
  onClose: () => void;
}

export function BillShareModal({ summary, onClose }: BillShareModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const monthDate = parse(summary.month, 'yyyy-MM', new Date());
  const monthFormatted = format(monthDate, 'yyyy年M月');

  // 生成并下载长图
  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    setGenerating(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });
      const link = document.createElement('a');
      link.download = `伴学小账_${summary.child.name}_${summary.month}_对账单.png`;
      link.href = dataUrl;
      link.click();
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to generate image', err);
      alert('长图生成失败，请截图保存');
    } finally {
      setGenerating(false);
    }
  };

  // 导出 CSV 表格
  const handleDownloadCSV = () => {
    const rows = [
      ['伴学小账 - 托管考勤对账单'],
      ['月份', summary.month, '孩子档案', summary.child.name, '班级', summary.child.grade || ''],
      ['法定工作日数', summary.workdayCount],
      [''],
      ['项目名称', '孩子人数', '计费模式', '出勤天数(人天)', '缺勤天数(人天)', '预付金额', '退费金额', '实际费用'],
    ];

    for (const ib of summary.itemBills) {
      rows.push([
        ib.item.name,
        `${ib.defaultChildCount || 1}人次`,
        ib.item.billingType === 'PER_MONTH' ? '按月预付+退费' : '按天计费',
        `${ib.presentDays}天 (${ib.presentPersonDays}人天)`,
        `${ib.absentDays}天 (${ib.absentPersonDays}人天)`,
        `¥${ib.prepaidAmount}`,
        ib.refundAmount > 0 ? `-¥${ib.refundAmount}` : '¥0',
        `¥${ib.actualUsedAmount}`,
      ]);
    }

    rows.push(['']);
    rows.push(['汇总数据']);
    rows.push(['预付总额', `¥${summary.totalPrepaid}`]);
    rows.push(['缺勤总退款', summary.totalRefund > 0 ? `-¥${summary.totalRefund}` : '¥0']);
    rows.push(['按天总消费', `+¥${summary.totalPerDayCost}`]);
    rows.push(['实际应付总额', `¥${summary.totalActualCost}`]);
    rows.push(['结算结余差额', `¥${summary.finalBalance}`]);

    // 缺勤明细
    rows.push(['']);
    rows.push(['缺勤退费日期明细']);
    rows.push(['项目', '日期', '请假人数', '退费金额', '原因']);
    for (const ib of summary.itemBills) {
      for (const ad of ib.absentDates) {
        const cCount = ad.childCount || 1;
        const ref = ad.refund ?? (cCount * ib.effectiveRefundPerDay);
        rows.push([ib.item.name, ad.date, `${cCount}人次`, ref > 0 ? `-¥${ref}` : '无退费', ad.notes || '请假']);
      }
    }

    const csvContent = '\uFEFF' + rows.map((e) => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `伴学小账_${summary.child.name}_${summary.month}_明细表.csv`);
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/30 backdrop-blur-2xs p-4 animate-in fade-in">
      <div className="w-full max-w-sm bg-white rounded-xl p-4 shadow-xl border border-stone-200 flex flex-col gap-3 max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-2">
          <div className="text-xs font-semibold text-stone-800">
            生成对账单 / 导出
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 待导出的卡片视图容器 (供 html-to-image 截图) */}
        <div className="border border-stone-200 rounded-lg overflow-hidden bg-stone-50 p-2">
          <div
            ref={cardRef}
            className="bg-white p-4 rounded-md flex flex-col gap-3 text-stone-800 font-sans border border-stone-100"
          >
            {/* 卡片顶部 Branding */}
            <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
              <div>
                <div className="font-bold text-sm text-brand-600 tracking-tight">
                  伴学小账 · 托管对账单
                </div>
                <div className="text-[10px] text-stone-400">BentoCare Attendance & Statement</div>
              </div>
              <div className="text-right">
                <div className="text-xs font-semibold text-stone-800">{monthFormatted}</div>
                <div className="text-[10px] text-stone-400">
                  {summary.child.name} ({summary.child.grade || '学生'})
                </div>
              </div>
            </div>

            {/* 核心金额看板 */}
            <div className="bg-amber-50/50 border border-amber-200/50 rounded-lg p-3 text-center">
              <div className="text-[10px] text-stone-500">当月实际应付净额</div>
              <div className="text-2xl font-bold text-stone-900 mt-0.5">¥{summary.totalActualCost.toFixed(2)}</div>
              <div className="flex items-center justify-center gap-3 mt-1.5 text-[10px] text-stone-600 pt-1.5 border-t border-amber-200/40">
                <span>预付 ¥{summary.totalPrepaid}</span>
                <span className="text-rose-600 font-medium">退费 {summary.totalRefund > 0 ? `-¥${summary.totalRefund}` : '¥0'}</span>
                <span>按天 +¥{summary.totalPerDayCost}</span>
              </div>
            </div>

            {/* 项目清单 */}
            <div className="flex flex-col gap-1.5">
              <div className="text-[10px] font-medium text-stone-400">项目结算</div>
              {summary.itemBills.map((ib) => (
                <div
                  key={ib.item.id}
                  className="flex items-center justify-between text-xs bg-stone-50 px-2 py-1.5 rounded-md"
                >
                  <div className="flex items-center gap-1.5">
                    <DynamicIcon name={ib.item.icon} className="w-3.5 h-3.5 text-amber-700" />
                    <span className="font-medium text-stone-800">{ib.item.name}</span>
                    <span className="text-[10px] text-stone-400">
                      ({ib.presentPersonDays}人天出勤 / {ib.absentPersonDays}人天请假)
                    </span>
                  </div>
                  <div className="font-semibold text-stone-900">¥{ib.actualUsedAmount}</div>
                </div>
              ))}
            </div>

            {/* 缺勤记录 */}
            {summary.itemBills.some((ib) => ib.absentDates.length > 0) && (
              <div className="flex flex-col gap-1 pt-2 border-t border-stone-100">
                <div className="text-[10px] font-medium text-rose-600">请假退费明细:</div>
                {summary.itemBills.flatMap((ib) =>
                  ib.absentDates.map((ad) => {
                    const cCount = ad.childCount || 1;
                    const refundVal = ad.refund ?? (cCount * ib.effectiveRefundPerDay);
                    return (
                      <div
                        key={`${ib.item.id}-${ad.date}`}
                        className="text-[10px] text-stone-500 flex items-center justify-between"
                      >
                        <span>
                          {ad.date} [{ib.item.name}] {ad.notes ? `(${ad.notes})` : ''}
                        </span>
                        <span className="text-rose-600 font-medium">
                          {refundVal > 0 ? `-¥${refundVal}` : '无退费'}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* 底部小字 */}
            <div className="text-center text-[9px] text-stone-400 pt-1.5 border-t border-stone-100">
              考勤自动核算 · 清晰透明
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex flex-col gap-1.5">
          <button
            onClick={handleDownloadImage}
            disabled={generating}
            className="w-full py-2 bg-brand-500 hover:bg-brand-600 text-white font-medium text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
          >
            {downloadSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span>长图已保存</span>
              </>
            ) : (
              <>
                <ImageIcon className="w-3.5 h-3.5" />
                <span>{generating ? '正在生成...' : '保存对账单长图'}</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownloadCSV}
            className="w-full py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            <span>导出 CSV 明细表格</span>
          </button>
        </div>
      </div>
    </div>
  );
}
