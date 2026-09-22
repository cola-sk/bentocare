'use client';

import { useLedgerStore } from '@/hooks/useLedgerStore';
import { Header } from '@/components/layout/Header';
import { ChildManager } from '@/components/settings/ChildManager';
import { ItemManager } from '@/components/settings/ItemManager';
import { DataBackup } from '@/components/settings/DataBackup';
import { HeartHandshake, Sparkles, ShieldCheck } from 'lucide-react';

export default function SettingsPage() {
  const {
    children,
    currentChild,
    currentChildId,
    setCurrentChildId,
    currentChildItems,
    currentMonth,
    setCurrentMonth,
    saveChild,
    deleteChild,
    saveItem,
    deleteItem,
    exportJSON,
    importJSON,
    resetToDefault,
  } = useLedgerStore();

  return (
    <div className="flex flex-col gap-4 pb-6">
      {/* 顶部导航 */}
      <Header
        childrenList={children}
        currentChild={currentChild}
        onSelectChild={setCurrentChildId}
        currentMonth={currentMonth}
        onMonthChange={setCurrentMonth}
        showMonthNav={false}
      />

      <div className="px-4 flex flex-col gap-4">
        {/* 孩子档案配置 */}
        <ChildManager
          childrenList={children}
          currentChildId={currentChildId}
          onSelectChild={setCurrentChildId}
          onSaveChild={saveChild}
          onDeleteChild={deleteChild}
        />

        {/* 托管/就餐服务项目与退费配置 */}
        <ItemManager
          items={currentChildItems}
          currentChildName={currentChild.name}
          onSaveItem={saveItem}
          onDeleteItem={deleteItem}
        />

        {/* 数据备份、恢复与云端持久化 */}
        <DataBackup
          onExportJSON={exportJSON}
          onImportJSON={importJSON}
          onResetToDefault={resetToDefault}
        />

        {/* 底部关于卡片 */}
        <div className="text-center text-slate-400 text-xs py-4 flex flex-col items-center gap-1">
          <div className="flex items-center gap-1 font-semibold text-slate-600">
            <HeartHandshake className="w-4 h-4 text-brand-500" />
            <span>伴学小账 (BentoCare)</span>
          </div>
          <p className="text-[11px] text-slate-400 max-w-xs">
            陪伴孩子上学成长 · 每一笔托管、午餐与考勤退费都清晰明了
          </p>
          <span className="text-[10px] text-slate-300 mt-1">版本 v1.0.0 · 支持 PWA 与多端同步</span>
        </div>
      </div>
    </div>
  );
}
