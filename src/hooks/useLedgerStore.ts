'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Child, ServiceItem, AttendanceRecord, PrepaidRecord, MonthlyBillSummary, AttendanceStatus } from '@/lib/types';
import { DEFAULT_CHILD, DEFAULT_ITEMS, generateInitialAttendances } from '@/lib/sample-data';
import { calculateMonthlySummary } from '@/lib/calculator';
import { fetchAndCacheHolidays, getDayInfo } from '@/lib/holidays';
import { format } from 'date-fns';
import { useAuth } from '@/components/auth/AuthBoundary';

/**
 * 历史数据自愈迁移：清理旧代码无脑将调休工作日标记为 OFF 的遗留记录
 */
function sanitizeAttendances(records: AttendanceRecord[]): AttendanceRecord[] {
  return records.map((rec) => {
    if (rec.status === 'OFF' && !rec.notes) {
      const dayInfo = getDayInfo(rec.date);
      if (dayInfo.isCompensatoryWorkday) {
        return { ...rec, status: 'PRESENT' as const };
      }
    }
    return rec;
  });
}

const STORAGE_KEYS = {
  CHILDREN: 'bentocare_children',
  ITEMS: 'bentocare_items',
  ATTENDANCES: 'bentocare_attendances',
  PREPAIDS: 'bentocare_prepaids',
  CURRENT_CHILD_ID: 'bentocare_current_child_id',
  CURRENT_MONTH: 'bentocare_current_month',
};

export function useLedgerStore() {
  const { user } = useAuth();
  const currentInitialMonth = format(new Date(), 'yyyy-MM');

  const [isClient, setIsClient] = useState(false);
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<Child[]>([DEFAULT_CHILD]);
  const [currentChildId, setCurrentChildId] = useState<string>(DEFAULT_CHILD.id);
  const [items, setItems] = useState<ServiceItem[]>(DEFAULT_ITEMS);
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [prepaids, setPrepaids] = useState<PrepaidRecord[]>([]);
  const [currentMonth, setCurrentMonth] = useState<string>(currentInitialMonth);

  const [holidaySyncing, setHolidaySyncing] = useState(false);
  const [holidayVersion, setHolidayVersion] = useState(0);
  const loadedRemoteMonths = useRef(new Set<string>());

  const keyForUser = useCallback((key: string) => `${key}:${user.id}`, [user.id]);

  // 本地缓存严格按用户 ID 分区，远端数据仍是唯一可信来源。
  useEffect(() => {
    setIsClient(true);
    setLoading(true);
    try {
      const storedChildren = localStorage.getItem(keyForUser(STORAGE_KEYS.CHILDREN));
      const storedItems = localStorage.getItem(keyForUser(STORAGE_KEYS.ITEMS));
      const storedAtts = localStorage.getItem(keyForUser(STORAGE_KEYS.ATTENDANCES));
      const storedPrepaids = localStorage.getItem(keyForUser(STORAGE_KEYS.PREPAIDS));
      const storedChildId = localStorage.getItem(keyForUser(STORAGE_KEYS.CURRENT_CHILD_ID));
      const storedMonth = localStorage.getItem(keyForUser(STORAGE_KEYS.CURRENT_MONTH));

      const parsedChildren: Child[] = storedChildren ? JSON.parse(storedChildren) : [DEFAULT_CHILD];
      const parsedItems: ServiceItem[] = storedItems ? JSON.parse(storedItems) : DEFAULT_ITEMS;
      const initialChildId = storedChildId || parsedChildren[0]?.id || DEFAULT_CHILD.id;
      const rawAtts: AttendanceRecord[] = storedAtts
        ? JSON.parse(storedAtts)
        : generateInitialAttendances(initialChildId, currentInitialMonth);
      const parsedAtts = sanitizeAttendances(rawAtts);
      const parsedPrepaids: PrepaidRecord[] = storedPrepaids ? JSON.parse(storedPrepaids) : [];

      setChildren(parsedChildren);
      setItems(parsedItems);
      setAttendances(parsedAtts);
      setPrepaids(parsedPrepaids);
      setCurrentChildId(initialChildId);
      if (storedMonth) setCurrentMonth(storedMonth);

      // 登录后从受保护接口刷新，避免把其它账号的本地数据带入当前会话。
      void fetchLedgerFromApi(storedMonth || currentInitialMonth);

      // 同步当前年份中国节假日
      const initialYear = parseInt(currentInitialMonth.split('-')[0], 10);
      fetchAndCacheHolidays(initialYear).then(() => {
        setHolidayVersion((v) => v + 1);
      });
    } catch (e) {
      console.warn('LocalStorage load error:', e);
      void fetchLedgerFromApi(currentInitialMonth);
    }
  }, [keyForUser, user.id]);

  // 持久化到 LocalStorage
  useEffect(() => {
    if (!isClient) return;
    try {
      localStorage.setItem(keyForUser(STORAGE_KEYS.CHILDREN), JSON.stringify(children));
      localStorage.setItem(keyForUser(STORAGE_KEYS.ITEMS), JSON.stringify(items));
      localStorage.setItem(keyForUser(STORAGE_KEYS.ATTENDANCES), JSON.stringify(attendances));
      localStorage.setItem(keyForUser(STORAGE_KEYS.PREPAIDS), JSON.stringify(prepaids));
      localStorage.setItem(keyForUser(STORAGE_KEYS.CURRENT_CHILD_ID), currentChildId);
      localStorage.setItem(keyForUser(STORAGE_KEYS.CURRENT_MONTH), currentMonth);
    } catch (e) {
      console.error('LocalStorage write error:', e);
    }
  }, [children, items, attendances, prepaids, currentChildId, currentMonth, isClient, keyForUser]);

  const fetchLedgerFromApi = async (month: string) => {
    try {
      const res = await fetch('/api/children');
      const data = await res.json();
      if (data.success && data.data?.length > 0) {
        const remoteChildren: Child[] = data.data;
        const ids = remoteChildren.map((child) => child.id);
        const [itemResults, attendanceResults, prepaidResults] = await Promise.all([
          Promise.all(ids.map((id) => fetch(`/api/items?childId=${encodeURIComponent(id)}`).then((r) => r.json()))),
          Promise.all(ids.map((id) => fetch(`/api/attendance?childId=${encodeURIComponent(id)}&month=${encodeURIComponent(month)}`).then((r) => r.json()))),
          Promise.all(ids.map((id) => fetch(`/api/prepaid?childId=${encodeURIComponent(id)}`).then((r) => r.json()))),
        ]);
        setChildren(remoteChildren);
        setItems(itemResults.flatMap((result) => result.success ? result.data : []));
        const remoteAttendances = sanitizeAttendances(attendanceResults.flatMap((result) => result.success ? result.data : []));
        setAttendances((previous) => [
          ...previous.filter((record) => !ids.includes(record.childId) || !record.date.startsWith(month)),
          ...remoteAttendances,
        ]);
        setPrepaids(prepaidResults.flatMap((result) => result.success ? result.data : []));
        setCurrentChildId((previous) => remoteChildren.some((child) => child.id === previous) ? previous : remoteChildren[0].id);
        loadedRemoteMonths.current.add(month);
      }
    } catch (err) {
      console.warn('Ledger sync failed; using this user\'s local cache.', err);
    } finally {
      setLoading(false);
    }
  };

  // 账本可以切换任意月份；首次进入该月时从当前用户的受保护接口补齐数据。
  useEffect(() => {
    if (!isClient || loading || loadedRemoteMonths.current.has(currentMonth)) return;
    void fetchLedgerFromApi(currentMonth);
  }, [currentMonth, isClient, loading]);

  const currentChild = useMemo(() => {
    return children.find((c) => c.id === currentChildId) || children[0] || DEFAULT_CHILD;
  }, [children, currentChildId]);

  const currentChildItems = useMemo(() => {
    return items.filter((it) => it.childId === currentChildId && it.isActive);
  }, [items, currentChildId]);

  const monthlySummary = useMemo<MonthlyBillSummary>(() => {
    return calculateMonthlySummary(currentChild, currentMonth, items, attendances, prepaids);
  }, [currentChild, currentMonth, items, attendances, prepaids, holidayVersion]);

  // 更新某日单项打卡
  const updateAttendance = useCallback(
    async (itemId: string, date: string, status: AttendanceStatus, notes?: string, childCount?: number) => {
      const targetItem = items.find((i) => i.id === itemId);
      setAttendances((prev) => {
        const existingIdx = prev.findIndex(
          (a) => a.childId === currentChildId && a.itemId === itemId && a.date === date
        );
        const resolvedChildCount =
          childCount !== undefined
            ? childCount
            : existingIdx >= 0 && prev[existingIdx].childCount !== undefined
            ? prev[existingIdx].childCount
            : targetItem?.defaultChildCount || 1;

        const updatedRecord: AttendanceRecord = {
          id: existingIdx >= 0 ? prev[existingIdx].id : `att-${currentChildId}-${itemId}-${date}`,
          childId: currentChildId,
          itemId,
          date,
          status,
          childCount: resolvedChildCount,
          notes,
        };

        if (existingIdx >= 0) {
          const next = [...prev];
          next[existingIdx] = updatedRecord;
          return next;
        } else {
          return [...prev, updatedRecord];
        }
      });

      // 同步到 API
      try {
        await fetch('/api/attendance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            childId: currentChildId,
            itemId,
            date,
            status,
            childCount: childCount ?? targetItem?.defaultChildCount ?? 1,
            notes,
          }),
        });
      } catch (err) {
        // Safe offline
      }
    },
    [currentChildId, items]
  );

  // 批量更新某日所有项目（如：一键全勤 / 一键请假）
  const batchMarkDay = useCallback(
    async (date: string, status: AttendanceStatus, notes?: string, childCounts?: Record<string, number>) => {
      const targetItems = items.filter((i) => i.childId === currentChildId && i.isActive);
      const newRecords: AttendanceRecord[] = targetItems.map((it) => ({
        id: `att-${currentChildId}-${it.id}-${date}`,
        childId: currentChildId,
        itemId: it.id,
        date,
        status,
        childCount: childCounts?.[it.id] ?? it.defaultChildCount ?? 1,
        notes,
      }));

      setAttendances((prev) => {
        const filtered = prev.filter(
          (a) => !(a.childId === currentChildId && a.date === date)
        );
        return [...filtered, ...newRecords];
      });

      try {
        await fetch('/api/attendance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newRecords),
        });
      } catch (err) {
        // Safe offline
      }
    },
    [currentChildId, items]
  );

  // 保存/添加孩子
  const saveChild = useCallback(async (childData: Partial<Child>) => {
    const isNew = !childData.id;
    const id = childData.id || `child-${Date.now()}`;
    const newChild: Child = {
      id,
      name: childData.name || '宝贝',
      avatar: childData.avatar || 'Smile',
      grade: childData.grade || '小学一年级',
      isDefault: childData.isDefault || false,
    };

    setChildren((prev) => {
      if (isNew) {
        return [...prev, newChild];
      }
      return prev.map((c) => (c.id === id ? { ...c, ...newChild } : c));
    });

    if (isNew) {
      // 默认给新孩子复制一套基础项目
      const newItems: ServiceItem[] = DEFAULT_ITEMS.map((it) => ({
        ...it,
        id: `item-${id}-${it.name}`,
        childId: id,
      }));
      setItems((prev) => [...prev, ...newItems]);
      setCurrentChildId(id);
    }

    try {
      const response = await fetch('/api/children', {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newChild),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || '保存孩子档案失败');

      if (isNew) {
        // 服务端会生成真实 ID 及默认项目；替换本地临时 ID，避免后续请求引用无效记录。
        setChildren((prev) => prev.map((child) => child.id === id ? payload.data : child));
        setItems((prev) => prev.filter((item) => item.childId !== id));
        setCurrentChildId(payload.data.id);
        const itemsResponse = await fetch(`/api/items?childId=${encodeURIComponent(payload.data.id)}`);
        const itemsPayload = await itemsResponse.json();
        if (itemsResponse.ok && itemsPayload.success) setItems((prev) => [...prev, ...itemsPayload.data]);
      } else {
        setChildren((prev) => prev.map((child) => child.id === id ? payload.data : child));
      }
    } catch (e) {
      console.warn('Child save sync failed; changes remain in this user\'s local cache.', e);
    }
  }, []);

  // 删除孩子
  const deleteChild = useCallback(async (childId: string) => {
    const remainingChildren = children.filter((child) => child.id !== childId);
    setChildren(remainingChildren);
    if (currentChildId === childId) {
      setCurrentChildId(remainingChildren[0].id);
    }
    setItems((prev) => prev.filter((i) => i.childId !== childId));
    setAttendances((prev) => prev.filter((a) => a.childId !== childId));
    setPrepaids((prev) => prev.filter((p) => p.childId !== childId));

    try {
      await fetch(`/api/children?id=${childId}`, { method: 'DELETE' });
    } catch (e) {}
  }, [children, currentChildId]);

  // 保存/编辑托管项目
  const saveItem = useCallback(
    async (itemData: Partial<ServiceItem> & { childId?: string }) => {
      const isNew = !itemData.id;
      const targetChildId = itemData.childId || currentChildId;
      const id = itemData.id || `item-${Date.now()}`;
      const newItem: ServiceItem = {
        id,
        childId: targetChildId,
        name: itemData.name || '新服务项目',
        icon: itemData.icon || 'Utensils',
        color: itemData.color || '#f97316',
        billingType: itemData.billingType || 'PER_MONTH',
        dayPrice: Number(itemData.dayPrice) || 0,
        monthPrice: Number(itemData.monthPrice) || 0,
        refundPerDay: Number(itemData.refundPerDay) || 0,
        refundMode: itemData.refundMode || 'FIXED',
        refundFixedDays: Number(itemData.refundFixedDays) || 22,
        defaultChildCount: Number(itemData.defaultChildCount) || 1,
        applicableDays: itemData.applicableDays && itemData.applicableDays.length > 0 ? itemData.applicableDays : ['WORKDAY'],
        isActive: itemData.isActive !== undefined ? itemData.isActive : true,
        sortOrder: itemData.sortOrder || 0,
      };

      setItems((prev) => {
        if (isNew) return [...prev, newItem];
        return prev.map((it) => (it.id === id ? newItem : it));
      });

      try {
        await fetch('/api/items', {
          method: isNew ? 'POST' : 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newItem),
        });
      } catch (e) {}
    },
    [currentChildId]
  );

  // 删除项目
  const deleteItem = useCallback(async (itemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    setAttendances((prev) => prev.filter((a) => a.itemId !== itemId));
    setPrepaids((prev) => prev.filter((p) => p.itemId !== itemId));

    try {
      await fetch(`/api/items?id=${itemId}`, { method: 'DELETE' });
    } catch (e) {}
  }, []);

  // 保存预付款记录
  const savePrepaid = useCallback(
    async (itemId: string, month: string, amount: number) => {
      setPrepaids((prev) => {
        const existingIdx = prev.findIndex(
          (p) => p.childId === currentChildId && p.itemId === itemId && p.month === month
        );
        const record: PrepaidRecord = {
          id: existingIdx >= 0 ? prev[existingIdx].id : `pre-${currentChildId}-${itemId}-${month}`,
          childId: currentChildId,
          itemId,
          month,
          amount,
          isPaid: true,
        };

        if (existingIdx >= 0) {
          const next = [...prev];
          next[existingIdx] = record;
          return next;
        }
        return [...prev, record];
      });

      try {
        await fetch('/api/prepaid', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            childId: currentChildId,
            itemId,
            month,
            amount,
            isPaid: true,
          }),
        });
      } catch (e) {}
    },
    [currentChildId]
  );

  // 导出 JSON 数据备份
  const exportJSON = useCallback(() => {
    const data = {
      version: '1.0',
      exportAt: new Date().toISOString(),
      children,
      items,
      attendances,
      prepaids,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `伴学小账_数据备份_${format(new Date(), 'yyyyMMdd_HHmm')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [children, items, attendances, prepaids]);

  // 恢复 JSON 数据
  const importJSON = useCallback((jsonData: any) => {
    try {
      if (jsonData.children && Array.isArray(jsonData.children)) setChildren(jsonData.children);
      if (jsonData.items && Array.isArray(jsonData.items)) setItems(jsonData.items);
      if (jsonData.attendances && Array.isArray(jsonData.attendances)) setAttendances(jsonData.attendances);
      if (jsonData.prepaids && Array.isArray(jsonData.prepaids)) setPrepaids(jsonData.prepaids);
      return true;
    } catch (e) {
      console.error('Import failed', e);
      return false;
    }
  }, []);

  // 重置为默认演示数据
  const resetToDefault = useCallback(() => {
    setChildren([DEFAULT_CHILD]);
    setItems(DEFAULT_ITEMS);
    setAttendances(generateInitialAttendances(DEFAULT_CHILD.id, currentInitialMonth));
    setPrepaids([]);
    setCurrentChildId(DEFAULT_CHILD.id);
    setCurrentMonth(currentInitialMonth);
  }, [currentInitialMonth]);

  // 手动/在线同步拉取节假日数据
  const syncHolidays = useCallback(
    async (yearToSync?: number) => {
      const y = yearToSync || parseInt(currentMonth.split('-')[0], 10);
      setHolidaySyncing(true);
      try {
        const holidays = await fetchAndCacheHolidays(y);
        setHolidayVersion((v) => v + 1);
        return { success: true, count: holidays.length, year: y };
      } catch (e: any) {
        return { success: false, error: e?.message || '同步失败' };
      } finally {
        setHolidaySyncing(false);
      }
    },
    [currentMonth]
  );

  return {
    loading,
    children,
    currentChild,
    currentChildId,
    setCurrentChildId,
    items,
    currentChildItems,
    attendances,
    prepaids,
    currentMonth,
    setCurrentMonth,
    monthlySummary,
    holidaySyncing,
    syncHolidays,
    updateAttendance,
    batchMarkDay,
    saveChild,
    deleteChild,
    saveItem,
    deleteItem,
    savePrepaid,
    exportJSON,
    importJSON,
    resetToDefault,
  };
}
