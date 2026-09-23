'use client';

import { useState } from 'react';
import { ServiceItem, BillingType, RefundMode, DayType } from '@/lib/types';
import { getMatchingDaysCountInMonth } from '@/lib/holidays';
import { Plus, Edit2, Trash2, X, Briefcase, Sun, PartyPopper } from 'lucide-react';
import { DynamicIcon, SERVICE_ITEM_ICON_KEYS } from '@/components/common/DynamicIcon';

interface ItemManagerProps {
  items: ServiceItem[];
  currentChildName: string;
  onSaveItem: (item: Partial<ServiceItem>) => void;
  onDeleteItem: (id: string) => void;
}

export function ItemManager({
  items,
  currentChildName,
  onSaveItem,
  onDeleteItem,
}: ItemManagerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // 表单状态
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('Utensils');
  const [billingType, setBillingType] = useState<BillingType>('PER_MONTH');
  const [defaultChildCount, setDefaultChildCount] = useState('1');
  const [applicableDays, setApplicableDays] = useState<DayType[]>(['WORKDAY']);
  const [monthPrice, setMonthPrice] = useState('1200');
  const [refundPerDay, setRefundPerDay] = useState('60');
  const [refundMode, setRefundMode] = useState<RefundMode>('FIXED');
  const [refundFixedDays, setRefundFixedDays] = useState('22');
  const [dayPrice, setDayPrice] = useState('25');

  const handleOpenAdd = () => {
    setEditingId(null);
    setName('');
    setIcon('Utensils');
    setBillingType('PER_MONTH');
    setDefaultChildCount('1');
    setApplicableDays(['WORKDAY']);
    setMonthPrice('1200');
    setRefundPerDay('60');
    setRefundMode('FIXED');
    setRefundFixedDays('22');
    setDayPrice('25');
    setIsEditing(true);
  };

  const handleOpenEdit = (it: ServiceItem) => {
    setEditingId(it.id);
    setName(it.name);
    setIcon(it.icon);
    setBillingType(it.billingType);
    setDefaultChildCount(String(it.defaultChildCount || 1));
    setApplicableDays(it.applicableDays && it.applicableDays.length > 0 ? it.applicableDays : ['WORKDAY']);
    setMonthPrice(String(it.monthPrice));
    setRefundPerDay(String(it.refundPerDay));
    setRefundMode(it.refundMode);
    setRefundFixedDays(String(it.refundFixedDays ?? 22));
    setDayPrice(String(it.dayPrice));
    setIsEditing(true);
  };

  const toggleDayType = (type: DayType) => {
    setApplicableDays((prev) => {
      if (prev.includes(type)) {
        if (prev.length <= 1) return prev;
        return prev.filter((t) => t !== type);
      } else {
        return [...prev, type];
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSaveItem({
      id: editingId || undefined,
      name: name.trim(),
      icon,
      billingType,
      defaultChildCount: Math.max(1, parseInt(defaultChildCount, 10) || 1),
      applicableDays: applicableDays.length > 0 ? applicableDays : ['WORKDAY'],
      monthPrice: Number(monthPrice) || 0,
      refundPerDay: Number(refundPerDay) || 0,
      refundMode,
      refundFixedDays: Math.max(1, parseFloat(refundFixedDays) || 22),
      dayPrice: Number(dayPrice) || 0,
    });
    setIsEditing(false);
  };

  const currentCountNum = Math.max(1, parseInt(defaultChildCount, 10) || 1);
  const now = new Date();
  const previewDaysCount = getMatchingDaysCountInMonth(now.getFullYear(), now.getMonth(), applicableDays);

  const formatApplicableDays = (days?: DayType[]) => {
    const list = days && days.length > 0 ? days : ['WORKDAY'];
    const labels: string[] = [];
    if (list.includes('WORKDAY')) labels.push('工作日');
    if (list.includes('WEEKEND')) labels.push('周末');
    if (list.includes('HOLIDAY')) labels.push('节假日');
    return labels.join('+');
  };

  const getRefundRuleLabel = (item: ServiceItem) => {
    if (item.billingType !== 'PER_MONTH') return `¥${item.dayPrice}/人/天`;
    if (item.refundMode === 'FIXED') return `固定退 ¥${item.refundPerDay}/天`;
    if (item.refundMode === 'FIXED_DAYS_DIVIDED') return `固定${item.refundFixedDays || 22}天折算退`;
    if (item.refundMode === 'CALENDAR_DIVIDED') return `按自然天数折算退`;
    return `按实际工作日折算退`;
  };

  return (
    <div className="bg-white rounded-xl p-4 border border-stone-200/80 shadow-xs flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-stone-900">服务项目</div>
          <div className="text-[10px] text-stone-400">设置 {currentChildName} 的服务标准与计费方式</div>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1 text-[11px] text-brand-700 bg-brand-50 hover:bg-brand-100 font-medium px-2.5 py-1 rounded-lg transition-colors border border-brand-200/60"
        >
          <Plus className="w-3 h-3" />
          <span>添加项目</span>
        </button>
      </div>

      {/* 项目列表 */}
      <div className="flex flex-col gap-1.5">
        {items.map((it) => {
          const count = it.defaultChildCount || 1;
          const daysTag = formatApplicableDays(it.applicableDays);
          return (
            <div
              key={it.id}
              className="p-2.5 rounded-lg border border-stone-200 bg-white hover:border-brand-300 flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-md bg-brand-50 flex items-center justify-center text-brand-600">
                  <DynamicIcon name={it.icon} className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-stone-900 flex items-center gap-1.5 flex-wrap">
                    <span>{it.name}</span>
                    <span className="text-[9px] bg-stone-100 text-stone-600 px-1 py-0.2 rounded font-normal">
                      {it.billingType === 'PER_MONTH' ? '按月' : '按天'}
                    </span>
                    <span className="text-[9px] bg-stone-100 text-stone-600 px-1 py-0.2 rounded font-normal">
                      {count}人次
                    </span>
                    <span className="text-[9px] bg-stone-100 text-stone-600 px-1 py-0.2 rounded font-normal">
                      {daysTag}
                    </span>
                  </div>
                  <div className="text-[10px] text-stone-400 mt-0.5">
                    {it.billingType === 'PER_MONTH'
                      ? `¥${it.monthPrice}/人/月 · ${getRefundRuleLabel(it)}`
                      : `¥${it.dayPrice}/人/天`}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenEdit(it)}
                  className="p-1.5 text-stone-400 hover:text-stone-700 rounded-md hover:bg-stone-100"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                {items.length > 1 && (
                  <button
                    onClick={() => {
                      if (confirm(`确定删除项目「${it.name}」吗？`)) {
                        onDeleteItem(it.id);
                      }
                    }}
                    className="p-1.5 text-stone-400 hover:text-rose-600 rounded-md hover:bg-rose-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 项目编辑/新建弹窗 */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-2xs p-4 animate-in fade-in">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-sm bg-white rounded-xl p-4 shadow-xl border border-stone-200 flex flex-col gap-3.5 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <span className="text-xs font-semibold text-stone-900">
                {editingId ? '编辑服务项目' : '添加服务项目'}
              </span>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 图标选择 (Lucide 图标) */}
            <div>
              <label className="text-[11px] font-medium text-stone-500 block mb-1">选择图标</label>
              <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                {SERVICE_ITEM_ICON_KEYS.map((iconKey) => {
                  const isSelected = icon === iconKey;
                  return (
                    <button
                      key={iconKey}
                      type="button"
                      onClick={() => setIcon(iconKey)}
                      className={`w-8 h-8 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                        isSelected
                          ? 'border-2 border-brand-500 bg-brand-50 text-brand-700 shadow-2xs'
                          : 'border border-stone-200 bg-white text-stone-500 hover:border-stone-300'
                      }`}
                    >
                      <DynamicIcon
                        name={iconKey}
                        className={`w-4 h-4 ${isSelected ? 'text-brand-600 stroke-[2.2]' : 'text-stone-500'}`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 项目名称 */}
            <div>
              <label className="text-[11px] font-medium text-stone-500 block mb-1">项目名称</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：学校午餐 / 小饭桌 / 晚托班 / 校车"
                className="w-full text-xs px-2.5 py-1.5 rounded-md border border-stone-200 text-stone-900 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              />
            </div>

            {/* 默认人次 */}
            <div>
              <label className="text-[11px] font-medium text-stone-500 block mb-1">默认人次</label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3].map((num) => {
                  const isSelected = defaultChildCount === String(num);
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setDefaultChildCount(String(num))}
                      className={`flex-1 py-1.5 rounded-md text-xs transition-colors border ${
                        isSelected
                          ? 'border-2 border-brand-500 bg-brand-50 text-stone-900 font-bold'
                          : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      {num} 人次
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 计费模式选择 */}
            <div>
              <label className="text-[11px] font-medium text-stone-500 block mb-1">计费模式</label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setBillingType('PER_MONTH')}
                  className={`py-2 px-2.5 rounded-md text-xs text-left border transition-all ${
                    billingType === 'PER_MONTH'
                      ? 'border-2 border-brand-500 bg-brand-50 text-stone-900 font-bold'
                      : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <div className={billingType === 'PER_MONTH' ? 'text-stone-900 font-bold' : 'text-stone-700'}>
                    按月预付 + 退费
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setBillingType('PER_DAY')}
                  className={`py-2 px-2.5 rounded-md text-xs text-left border transition-all ${
                    billingType === 'PER_DAY'
                      ? 'border-2 border-brand-500 bg-brand-50 text-stone-900 font-bold'
                      : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <div className={billingType === 'PER_DAY' ? 'text-stone-900 font-bold' : 'text-stone-700'}>
                    按天计费
                  </div>
                </button>
              </div>
            </div>

            {/* 适用日期类型 */}
            <div className="bg-stone-50/80 p-2.5 rounded-lg border border-stone-200 flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-medium text-stone-700">适用日期类型</span>
                <span className="text-[10px] text-stone-400">当月 {previewDaysCount} 天</span>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { type: 'WORKDAY' as DayType, label: '工作日', icon: Briefcase },
                  { type: 'WEEKEND' as DayType, label: '周末', icon: Sun },
                  { type: 'HOLIDAY' as DayType, label: '节假日', icon: PartyPopper },
                ].map((item) => {
                  const isSelected = applicableDays.includes(item.type);
                  const IconComp = item.icon;
                  return (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => toggleDayType(item.type)}
                      className={`py-1.5 px-2 rounded-md text-xs flex items-center justify-center gap-1.5 transition-colors border ${
                        isSelected
                          ? 'border-2 border-brand-500 bg-brand-50 text-stone-900 font-bold'
                          : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      <IconComp className={`w-3.5 h-3.5 ${isSelected ? 'text-brand-600' : 'text-stone-400'}`} />
                      <span className={isSelected ? 'text-stone-900 font-bold' : 'text-stone-600'}>
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 费用配置 */}
            {billingType === 'PER_MONTH' ? (
              <div className="flex flex-col gap-2.5 bg-stone-50/80 p-2.5 rounded-lg border border-stone-200">
                <div>
                  <label className="text-[10px] font-medium text-stone-500 block mb-0.5">
                    单人包月金额 (元/月)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={monthPrice}
                    onChange={(e) => setMonthPrice(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 rounded-md border border-stone-200 bg-white text-stone-900 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-medium text-stone-500 block mb-0.5">
                    退费规则 (每日费用折算方式)
                  </label>
                  <select
                    value={refundMode}
                    onChange={(e) => setRefundMode(e.target.value as RefundMode)}
                    className="w-full text-xs px-2 py-1.5 rounded-md border border-stone-200 bg-white text-stone-900 focus:outline-none focus:border-brand-500"
                  >
                    <option value="WORKDAY_DIVIDED">按当月实际工作日折算 (随月动态)</option>
                    <option value="FIXED_DAYS_DIVIDED">按固定天数折算 (如固定22天)</option>
                    <option value="CALENDAR_DIVIDED">按当月自然天数折算 (28~31天)</option>
                    <option value="FIXED">固定单人单日退费金额</option>
                  </select>
                </div>

                {refundMode === 'FIXED_DAYS_DIVIDED' && (
                  <div className="flex flex-col gap-1.5">
                    <div>
                      <label className="text-[10px] font-medium text-stone-500 block mb-0.5">
                        每月固定折算天数 (天)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        step="0.5"
                        value={refundFixedDays}
                        onChange={(e) => setRefundFixedDays(e.target.value)}
                        placeholder="22"
                        className="w-full text-xs px-2.5 py-1.5 rounded-md border border-stone-200 bg-white text-stone-900 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                      />
                    </div>
                    {(() => {
                      const days = Math.max(1, parseFloat(refundFixedDays) || 22);
                      const mPrice = Number(monthPrice) || 0;
                      const perDayEst = (mPrice / days).toFixed(2);
                      return (
                        <div className="text-[10px] text-amber-800 bg-amber-50 p-2 rounded border border-amber-200/60 leading-relaxed">
                          💡 <strong>每日费用折算：</strong>¥{mPrice} ÷ {days}天 ≈ <span className="font-semibold text-rose-600">¥{perDayEst}</span>/人/天。<br />
                          请假缺勤时，将固定按此单日标准退费。
                        </div>
                      );
                    })()}
                  </div>
                )}

                {refundMode === 'WORKDAY_DIVIDED' && (
                  (() => {
                    const mPrice = Number(monthPrice) || 0;
                    const perDayEst = previewDaysCount > 0 ? (mPrice / previewDaysCount).toFixed(2) : '0';
                    return (
                      <div className="text-[10px] text-stone-600 bg-stone-100 p-2 rounded border border-stone-200/70 leading-relaxed">
                        💡 <strong>实际工作日折算：</strong>本月符合排期的国家法定工作日(含周末调休补班)共约 <strong>{previewDaysCount}</strong> 天，单日费用折算预估 ≈ <span className="font-semibold text-stone-900">¥{perDayEst}</span>/人/天。<br />
                        每月系统将自动按实际工作日天数精准折算每日退费额。
                      </div>
                    );
                  })()
                )}

                {refundMode === 'CALENDAR_DIVIDED' && (
                  (() => {
                    const totalCalDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
                    const mPrice = Number(monthPrice) || 0;
                    const perDayEst = (mPrice / totalCalDays).toFixed(2);
                    return (
                      <div className="text-[10px] text-stone-600 bg-stone-100 p-2 rounded border border-stone-200/70 leading-relaxed">
                        💡 <strong>自然天数折算：</strong>本月自然日历总天数共 <strong>{totalCalDays}</strong> 天，单日费用折算预估 ≈ <span className="font-semibold text-stone-900">¥{perDayEst}</span>/人/天。
                      </div>
                    );
                  })()
                )}

                {refundMode === 'FIXED' && (
                  <div>
                    <label className="text-[10px] font-medium text-stone-500 block mb-0.5">
                      单人单日退费 (元/天)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={refundPerDay}
                      onChange={(e) => setRefundPerDay(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 rounded-md border border-stone-200 bg-white text-stone-900 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-stone-50/80 p-2.5 rounded-lg border border-stone-200">
                <label className="text-[10px] font-medium text-stone-500 block mb-0.5">
                  单人单日费用 (元/天)
                </label>
                <input
                  type="number"
                  min="0"
                  value={dayPrice}
                  onChange={(e) => setDayPrice(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-md border border-stone-200 bg-white text-stone-900 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                />
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2 bg-brand-500 hover:bg-brand-600 text-white font-medium text-xs rounded-lg transition-colors mt-1 shadow-xs"
            >
              保存
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
