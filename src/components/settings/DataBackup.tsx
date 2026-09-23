'use client';

import { useRef, useState } from 'react';
import { Download, Upload, RotateCcw, Database, Check } from 'lucide-react';

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
    <div className="bg-white rounded-xl p-4 border border-stone-200/80 shadow-xs flex flex-col gap-3">
      <div className="text-xs font-semibold text-stone-900">数据备份与同步</div>

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
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-stone-50 hover:bg-stone-100 border border-stone-200/80 text-stone-700 text-xs font-medium transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-stone-500" />
          <span>导出备份 (JSON)</span>
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-stone-50 hover:bg-stone-100 border border-stone-200/80 text-stone-700 text-xs font-medium transition-colors"
        >
          {importSuccess ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-700 font-medium">导入成功</span>
            </>
          ) : (
            <>
              <Upload className="w-3.5 h-3.5 text-stone-500" />
              <span>导入备份</span>
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
        className="w-full py-2 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50/50 text-xs font-medium transition-colors flex items-center justify-center gap-1"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        <span>恢复默认数据</span>
      </button>

      {/* 云端存储说明 */}
      <div className="pt-2.5 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
        <div className="flex items-center gap-1">
          <Database className="w-3.5 h-3.5 text-stone-400" />
          <span>支持本地存储与 Postgres 云端同步</span>
        </div>
        <span className="text-[10px] text-emerald-700 font-medium">已就绪</span>
      </div>
    </div>
  );
}
