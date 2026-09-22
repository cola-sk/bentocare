'use client';

import { useRef, useState } from 'react';
import { Download, Upload, RotateCcw, Database, ShieldCheck, Check } from 'lucide-react';

interface DataBackupProps {
  onExportJSON: () => void;
  onImportJSON: (data: any) => boolean;
  onResetToDefault: () => void;
}

export function DataBackup({
  onExportJSON,
  onImportJSON,
  onResetToDefault,
}: DataBackupProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importSuccess, setImportSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const success = onImportJSON(json);
        if (success) {
          setImportSuccess(true);
          setTimeout(() => setImportSuccess(false), 3000);
        } else {
          alert('数据文件格式不正确');
        }
      } catch (err) {
        alert('解析 JSON 失败');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="bg-white rounded-3xl p-4 shadow-card border border-slate-100 flex flex-col gap-3">
      <div className="text-sm font-bold text-slate-800">数据管理与同步</div>

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onExportJSON}
          className="flex items-center justify-center gap-1.5 p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-100 text-slate-700 text-xs font-semibold transition-all active:scale-95"
        >
          <Download className="w-4 h-4 text-brand-500" />
          <span>导出完整备份 (JSON)</span>
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center gap-1.5 p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-100 text-slate-700 text-xs font-semibold transition-all active:scale-95"
        >
          {importSuccess ? (
            <>
              <Check className="w-4 h-4 text-emerald-500" />
              <span className="text-emerald-600">导入成功</span>
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 text-emerald-500" />
              <span>导入备份文件</span>
            </>
          )}
        </button>
      </div>

      <button
        onClick={() => {
          if (confirm('确定要恢复为初始演示数据吗？（当前记录将被重置）')) {
            onResetToDefault();
          }
        }}
        className="w-full py-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        <span>重置为默认演示数据</span>
      </button>

      {/* Vercel Postgres 云存储状态卡片 */}
      <div className="mt-2 p-3 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs font-bold">
          <div className="flex items-center gap-1.5 text-brand-400">
            <Database className="w-4 h-4" />
            <span>Vercel Postgres 云数据库存储</span>
          </div>
          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
            已就绪 / 自动同步
          </span>
        </div>
        <div className="text-[11px] text-slate-300 leading-relaxed">
          本项目已全面配置 Vercel Postgres Prisma ORM 数据模型。部署到 Vercel 时直接在控制台绑定 Storage Postgres，家庭成员即可通过手机随时随地多端打卡同步。
        </div>
      </div>
    </div>
  );
}
