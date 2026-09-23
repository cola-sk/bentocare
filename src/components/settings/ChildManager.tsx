'use client';

import { useState } from 'react';
import { Child } from '@/lib/types';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { DynamicIcon, AVATAR_ICON_KEYS } from '@/components/common/DynamicIcon';

interface ChildManagerProps {
  childrenList: Child[];
  currentChildId: string;
  onSelectChild: (id: string) => void;
  onSaveChild: (child: Partial<Child>) => void;
  onDeleteChild: (id: string) => void;
}

export function ChildManager({
  childrenList,
  currentChildId,
  onSelectChild,
  onSaveChild,
  onDeleteChild,
}: ChildManagerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('Smile');
  const [grade, setGrade] = useState('小学一年级');

  const handleOpenAdd = () => {
    setEditingId(null);
    setName('');
    setAvatar('Smile');
    setGrade('小学一年级');
    setIsEditing(true);
  };

  const handleOpenEdit = (c: Child) => {
    setEditingId(c.id);
    setName(c.name);
    setAvatar(c.avatar || 'Smile');
    setGrade(c.grade || '小学一年级');
    setIsEditing(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSaveChild({
      id: editingId || undefined,
      name: name.trim(),
      avatar,
      grade,
    });
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-xl p-4 border border-stone-200/80 shadow-xs flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-stone-900">孩子档案</div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1 text-[11px] text-brand-700 bg-brand-50 hover:bg-brand-100 font-medium px-2.5 py-1 rounded-lg transition-colors border border-brand-200/60"
        >
          <Plus className="w-3 h-3" />
          <span>添加孩子</span>
        </button>
      </div>

      {/* 孩子卡片列表 */}
      <div className="flex flex-col gap-1.5">
        {childrenList.map((child) => {
          const isCurrent = child.id === currentChildId;
          return (
            <div
              key={child.id}
              className={`p-2.5 rounded-lg border flex items-center justify-between transition-all ${
                isCurrent
                  ? 'border-2 border-brand-500 bg-brand-50/40'
                  : 'border border-stone-200 bg-white hover:border-brand-300'
              }`}
            >
              <div
                onClick={() => onSelectChild(child.id)}
                className="flex items-center gap-2.5 flex-1 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-md bg-brand-50 flex items-center justify-center text-brand-600">
                  <DynamicIcon name={child.avatar || 'Smile'} className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                    <span>{child.name}</span>
                    {isCurrent && (
                      <span className="text-[10px] bg-brand-500 text-white font-medium px-1.5 py-0.2 rounded">
                        当前选中
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-stone-400">{child.grade || '未填班级'}</div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenEdit(child)}
                  className="p-1.5 text-stone-400 hover:text-stone-700 rounded-md hover:bg-stone-100"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                {childrenList.length > 1 && (
                  <button
                    onClick={() => {
                      if (confirm(`确定删除 ${child.name} 的全部档案与考勤数据吗？`)) {
                        onDeleteChild(child.id);
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

      {/* 编辑/新增弹窗 */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-2xs p-4 animate-in fade-in">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-sm bg-white rounded-xl p-4 shadow-xl border border-stone-200 flex flex-col gap-3.5"
          >
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <span className="text-xs font-semibold text-stone-900">
                {editingId ? '编辑孩子档案' : '添加孩子档案'}
              </span>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 头像选择 */}
            <div>
              <label className="text-[11px] font-medium text-stone-500 block mb-1">选择图标</label>
              <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                {AVATAR_ICON_KEYS.map((iconKey) => {
                  const isSelected = avatar === iconKey;
                  return (
                    <button
                      key={iconKey}
                      type="button"
                      onClick={() => setAvatar(iconKey)}
                      className={`w-8 h-8 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                        isSelected
                          ? 'border-2 border-brand-500 bg-brand-50 text-brand-700 shadow-2xs'
                          : 'border border-stone-200 text-stone-500 hover:border-stone-300'
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

            {/* 姓名 */}
            <div>
              <label className="text-[11px] font-medium text-stone-500 block mb-1">孩子昵称/姓名</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：豆豆 / 涵涵"
                className="w-full text-xs px-2.5 py-1.5 rounded-md border border-stone-200 text-stone-900 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              />
            </div>

            {/* 班级 */}
            <div>
              <label className="text-[11px] font-medium text-stone-500 block mb-1">所在班级 / 学校</label>
              <input
                type="text"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="例如：小学一年级 (2) 班"
                className="w-full text-xs px-2.5 py-1.5 rounded-md border border-stone-200 text-stone-900 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              />
            </div>

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
