'use client';

import { useState } from 'react';
import { useLedgerStore } from '@/hooks/useLedgerStore';
import { Header } from '@/components/layout/Header';
import { MonthCalendar } from '@/components/calendar/MonthCalendar';
import { DayDetailModal } from '@/components/calendar/DayDetailModal';
import { BatchActionBar } from '@/components/calendar/BatchActionBar';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function CalendarPage() {
  const router = useRouter();
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const {
    loading,
    children,
    currentChild,
    setCurrentChildId,
    currentChildItems,
    attendances,
    currentMonth,
    setCurrentMonth,
    monthlySummary,
    updateAttendance,
    batchMarkDay,
  } = useLedgerStore();

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);

  const handleSelectDate = (dateStr: string) => {
    setSelectedDate(dateStr);
    setShowDetailModal(true);
  };

  const handleOpenToday = () => {
    setSelectedDate(todayStr);
    setShowDetailModal(true);
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-stone-400">
        <Loader2 className="w-6 h-6 animate-spin text-brand-500 mb-2" />
        <span className="text-xs">加载中...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3.5 pb-4">
      {/* 顶部导航与孩子选择器 */}
      <Header
        childrenList={children}
        currentChild={currentChild}
        onSelectChild={setCurrentChildId}
        currentMonth={currentMonth}
        onMonthChange={setCurrentMonth}
      />

      {/* 核心内容区 */}
      <div className="px-4 flex flex-col gap-3">
        {/* 今日状态与对账微卡 */}
        <BatchActionBar
          summary={monthlySummary}
          onOpenToday={handleOpenToday}
          onOpenBills={() => router.push('/bills')}
        />

        {/* 考勤日历网格 */}
        <MonthCalendar
          currentMonth={currentMonth}
          items={currentChildItems}
          attendances={attendances}
          selectedDate={selectedDate}
          onSelectDate={handleSelectDate}
        />
      </div>

      {/* 单日打卡与退费备注弹窗 */}
      {showDetailModal && (
        <DayDetailModal
          dateStr={selectedDate}
          items={currentChildItems}
          attendances={attendances}
          onUpdateAttendance={updateAttendance}
          onBatchMark={batchMarkDay}
          onClose={() => setShowDetailModal(false)}
        />
      )}
    </div>
  );
}
