'use client';

import { useState } from 'react';
import { ServiceItem, BillingType, RefundMode } from '@/lib/types';
import { Plus, Edit2, Trash2, Check, HelpCircle } from 'lucide-react';

interface ItemManagerProps {
  items: ServiceItem[];
  currentChildName: string;
  onSaveItem: (item: Partial<ServiceItem>) => void;
  onDeleteItem: (id: string) => void;
}

const ICON_OPTIONS = ['🍱', '🏠', '🚌', '📚', '🥛', '🎨', '⚽', '🍎', '🥪', '🧸'];

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
  const [icon, setIcon] = useState('🍱');
  const [billingType, setBillingType] = useState<BillingType>('PER_MONTH');
  const [monthPrice, setMonthPrice] = useState('1200');
  const [refundPerDay, setRefundPerDay] = useState('60');
  const [refundMode, setRefundMode] = useState<RefundMode>('FIXED');
  const [dayPrice, setDayPrice] = useState('25');

  const handleOpenAdd = () => {
    setEditingId(null);
    setName('');
    setIcon('🍱');
    setBillingType('PER_MONTH');
    setMonthPrice('1200');
    setRefundPerDay('60');
    setRefundMode('FIXED');
    setDayPrice('25');
    setIsEditing(true);
  };

  const handleOpenEdit = (it: ServiceItem) => {
    setEditingId(it.id);
    setName(it.name);
    setIcon(it.icon);
    setBillingType(it.billingType);
    setMonthPrice(String(it.monthPrice));
    setRefundPerDay(String(it.refundPerDay));
    setRefundMode(it.refundMode);
    setDayPrice(String(it.dayPrice));
    setIsEditing(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSaveItem({
      id: editingId || undefined,
      name: name.trim(),
      icon,
      billingType,
      monthPrice: Number(monthPrice) || 0,
      refundPerDay: Number(refundPerDay) || 0,
      refundMode,
      dayPrice: Number(dayPrice) || 0,
    });
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-3xl p-4 shadow-card border border-slate-100 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-bold text-slate-800">托管/就餐项目配置</div>
          <div className="text-[11px] text-slate-400">设置 {currentChildName} 的服务项目与退费标准</div>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1 text-xs text-brand-600 bg-brand-50 hover:bg-brand-100 font-semibold px-3 py-1.5 rounded-full transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>添加项目</span>
        </button>
      </div>

      {/* 项目列表 */}
      <div className="flex flex-col gap-2">
        {items.map((it) => (
          <div
            key={it.id}
            className="p-3 rounded-2xl border border-slate-100 bg-slate-50/50 flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-2xl p-1 bg-white rounded-xl shadow-xs">{it.icon}</span>
              <div>
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span>{it.name}</span>
                  <span
                    className={`text-[9px] font-semibold px-1.5 py-0.2 rounded-md ${
                      it.billingType === 'PER_MONTH'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {it.billingType === 'PER_MONTH' ? '按月预付+退费' : '按天计费'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {it.billingType === 'PER_MONTH'
                    ? `包月: ¥${it.monthPrice} | 缺勤退: ¥${it.refundPerDay}/天 (${
                        it.refundMode === 'FIXED' ? '固定' : '工作日均摊'
                      })`
                    : `单日标准: ¥${it.dayPrice}/天`}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => handleOpenEdit(it)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-white"
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
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 项目编辑/新建弹窗 */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl flex flex-col gap-3.5 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-sm font-bold text-slate-800">
                {editingId ? '编辑服务项目' : '添加服务项目'}
              </span>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {/* 图标选择 */}
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">选择图标</label>
              <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                {ICON_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setIcon(emoji)}
                    className={`text-lg p-1.5 rounded-xl border transition-all ${
                      icon === emoji
                        ? 'border-brand-500 bg-brand-50 scale-110'
                        : 'border-slate-100 hover:bg-slate-50'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* 项目名称 */}
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">项目名称</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：学校午餐 / 小饭桌 / 晚托班 / 校车"
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* 计费模式选择 */}
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">计费模式</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setBillingType('PER_MONTH')}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all text-left ${
                    billingType === 'PER_MONTH'
                      ? 'border-brand-500 bg-brand-50 text-brand-700 ring-1 ring-brand-500'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-bold">按月预付 + 缺勤退费</div>
                  <div className="text-[10px] text-slate-400 font-normal mt-0.5">包月扣费，请假退款</div>
                </button>

                <button
                  type="button"
                  onClick={() => setBillingType('PER_DAY')}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all text-left ${
                    billingType === 'PER_DAY'
                      ? 'border-brand-500 bg-brand-50 text-brand-700 ring-1 ring-brand-500'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-bold">按天计费 / 后付</div>
                  <div className="text-[10px] text-slate-400 font-normal mt-0.5">来一天算一天</div>
                </button>
              </div>
            </div>

            {/* 条件配置项 */}
            {billingType === 'PER_MONTH' ? (
              <div className="flex flex-col gap-2.5 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    包月标准金额 (元/月)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={monthPrice}
                    onChange={(e) => setMonthPrice(e.target.value)}
                    placeholder="1200"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    缺勤单日退费金额 (元/天)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={refundPerDay}
                    onChange={(e) => setRefundPerDay(e.target.value)}
                    placeholder="60"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    退费计算规则
                  </label>
                  <select
                    value={refundMode}
                    onChange={(e) => setRefundMode(e.target.value as RefundMode)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="FIXED">固定单日标准退还 (如每天固定退 ¥60)</option>
                    <option value="WORKDAY_DIVIDED">按当月工作日天数自动均摊退还</option>
                  </select>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  单日费用标准 (元/天)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={dayPrice}
                  onChange={(e) => setDayPrice(e.target.value)}
                  placeholder="25"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white"
                />
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs rounded-xl shadow-float transition-all active:scale-98 mt-1"
            >
              保存项目设置
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
