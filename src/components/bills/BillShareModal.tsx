'use client';

import { useRef, useState } from 'react';
import { MonthlyBillSummary } from '@/lib/types';
import { toPng } from 'html-to-image';
import { Download, FileSpreadsheet, X, Check, Image as ImageIcon, Sparkles } from 'lucide-react';
import { format, parse } from 'date-fns';

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
      ['月份', summary.month, '孩子', summary.child.name, '班级', summary.child.grade || ''],
      ['法定工作日数', summary.workdayCount],
      [''],
      ['项目名称', '计费模式', '出勤天数', '缺勤天数', '预付金额', '退费金额', '实际费用'],
    ];

    for (const ib of summary.itemBills) {
      rows.push([
        ib.item.name,
        ib.item.billingType === 'PER_MONTH' ? '按月预付+退费' : '按天计费',
        String(ib.presentDays),
        String(ib.absentDays),
        `¥${ib.prepaidAmount}`,
        `-¥${ib.refundAmount}`,
        `¥${ib.actualUsedAmount}`,
      ]);
    }

    rows.push(['']);
    rows.push(['汇总数据']);
    rows.push(['预付总额', `¥${summary.totalPrepaid}`]);
    rows.push(['缺勤总退款', `-¥${summary.totalRefund}`]);
    rows.push(['按天总消费', `+¥${summary.totalPerDayCost}`]);
    rows.push(['实际应付总额', `¥${summary.totalActualCost}`]);
    rows.push(['结算结余差额', `¥${summary.finalBalance}`]);

    // 缺勤明细
    rows.push(['']);
    rows.push(['缺勤退费日期明细']);
    rows.push(['项目', '日期', '原因']);
    for (const ib of summary.itemBills) {
      for (const ad of ib.absentDates) {
        rows.push([ib.item.name, ad.date, ad.notes || '请假']);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-1.5 font-bold text-slate-800 text-sm">
            <Sparkles className="w-4 h-4 text-brand-500" />
            <span>生成对账卡片 / 导出</span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-xs font-bold"
          >
            ✕
          </button>
        </div>

        {/* 待导出的卡片视图容器 (供 html-to-image 截图) */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-slate-50 p-2">
          <div
            ref={cardRef}
            className="bg-white p-5 rounded-xl flex flex-col gap-3 text-slate-800 border border-slate-100 font-sans"
          >
            {/* 卡片顶部 Branding */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🍱</span>
                <div>
                  <div className="font-extrabold text-sm text-brand-600 tracking-tight">
                    伴学小账 · 托管对账单
                  </div>
                  <div className="text-[10px] text-slate-400">BentoCare Attendance & Refund</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-slate-800">{monthFormatted}</div>
                <div className="text-[10px] text-slate-400">
                  {summary.child.name} ({summary.child.grade || '学生'})
                </div>
              </div>
            </div>

            {/* 核心金额看板 */}
            <div className="bg-gradient-to-r from-brand-500 to-amber-500 text-white rounded-xl p-3 text-center">
              <div className="text-[10px] text-amber-100 font-medium">当月实际应付净额</div>
              <div className="text-2xl font-black mt-0.5">¥{summary.totalActualCost.toFixed(2)}</div>
              <div className="flex items-center justify-center gap-3 mt-1.5 text-[10px] pt-1.5 border-t border-white/20">
                <span>预付: ¥{summary.totalPrepaid}</span>
                <span>退费: -¥{summary.totalRefund}</span>
                <span>按天: +¥{summary.totalPerDayCost}</span>
              </div>
            </div>

            {/* 项目清单 */}
            <div className="flex flex-col gap-1.5">
              <div className="text-[10px] font-bold text-slate-400">项目结算明细</div>
              {summary.itemBills.map((ib) => (
                <div
                  key={ib.item.id}
                  className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded-lg"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{ib.item.icon}</span>
                    <span className="font-semibold text-slate-700">{ib.item.name}</span>
                    <span className="text-[10px] text-slate-400">
                      ({ib.presentDays}出勤 / {ib.absentDays}请假)
                    </span>
                  </div>
                  <div className="font-bold text-slate-800">¥{ib.actualUsedAmount}</div>
                </div>
              ))}
            </div>

            {/* 缺勤记录 */}
            {summary.itemBills.some((ib) => ib.absentDates.length > 0) && (
              <div className="flex flex-col gap-1 pt-2 border-t border-slate-100">
                <div className="text-[10px] font-bold text-rose-500">请假缺勤与退费日期:</div>
                {summary.itemBills.flatMap((ib) =>
                  ib.absentDates.map((ad) => (
                    <div
                      key={`${ib.item.id}-${ad.date}`}
                      className="text-[10px] text-slate-500 flex items-center justify-between"
                    >
                      <span>
                        • {ad.date} [{ib.item.name}] {ad.notes ? `(${ad.notes})` : ''}
                      </span>
                      <span className="text-rose-500 font-semibold">
                        -¥{ib.effectiveRefundPerDay}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 底部小字 */}
            <div className="text-center text-[9px] text-slate-400 pt-2 border-t border-slate-100">
              伴学小账 考勤自动退费结算 · 家庭清晰账单
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex flex-col gap-2">
          <button
            onClick={handleDownloadImage}
            disabled={generating}
            className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs rounded-xl shadow-float transition-all flex items-center justify-center gap-1.5"
          >
            {downloadSuccess ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>长图已保存到手机相册/下载</span>
              </>
            ) : (
              <>
                <ImageIcon className="w-4 h-4" />
                <span>{generating ? '正在生成长图...' : '保存对账单长图 (发送微信/家长群)'}</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownloadCSV}
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>导出 CSV 明细表格 (Excel 打开)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
