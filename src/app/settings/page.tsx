'use client';

import { useLedgerStore } from '@/hooks/useLedgerStore';
import { Header } from '@/components/layout/Header';
import { ChildManager } from '@/components/settings/ChildManager';
import { ItemManager } from '@/components/settings/ItemManager';
import { HolidayManager } from '@/components/settings/HolidayManager';
import { DataBackup } from '@/components/settings/DataBackup';

export default function SettingsPage() {
  const {
    children,
    currentChild,
    currentChildId,
    setCurrentChildId,
    currentChildItems,
    currentMonth,
    setCurrentMonth,
    holidaySyncing,
    syncHolidays,
    saveChild,
    deleteChild,
    saveItem,
    deleteItem,
    exportJSON,
    importJSON,
    resetToDefault,
  } = useLedgerStore();

  return (
    <div className="flex flex-col gap-3.5 pb-6">
      {/* 顶部导航 */}
      <Header
        childrenList={children}
        currentChild={currentChild}
        onSelectChild={setCurrentChildId}
        currentMonth={currentMonth}
        onMonthChange={setCurrentMonth}
        showMonthNav={false}
      />

      <div className="px-4 flex flex-col gap-3.5">
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

        {/* 中国节假日与调休识别管理 */}
        <HolidayManager
          currentMonth={currentMonth}
          holidaySyncing={holidaySyncing}
          onSyncHolidays={syncHolidays}
        />

        {/* 数据备份与同步 */}
        <DataBackup
          onExportJSON={exportJSON}
          onImportJSON={importJSON}
          onResetToDefault={resetToDefault}
        />

        {/* 底部轻量版本信息 */}
        <div className="text-center text-[10px] text-stone-300 py-3">
          伴学小账 · BentoCare v1.0.0
        </div>
      </div>
    </div>
  );
}
