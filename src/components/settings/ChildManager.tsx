'use client';

import { useState } from 'react';
import { Child } from '@/lib/types';
import { Plus, Edit2, Trash2, Check, UserPlus } from 'lucide-react';

interface ChildManagerProps {
  childrenList: Child[];
  currentChildId: string;
  onSelectChild: (id: string) => void;
  onSaveChild: (child: Partial<Child>) => void;
  onDeleteChild: (id: string) => void;
}

const AVATAR_OPTIONS = ['🧒', '👧', '👶', '👦', '🧑‍🎓', '🐣', '🐰', '🐼'];

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
  const [avatar, setAvatar] = useState('🧒');
  const [grade, setGrade] = useState('小学一年级');

  const handleOpenAdd = () => {
    setEditingId(null);
    setName('');
    setAvatar('🧒');
    setGrade('小学一年级');
    setIsEditing(true);
  };

  const handleOpenEdit = (c: Child) => {
    setEditingId(c.id);
    setName(c.name);
    setAvatar(c.avatar || '🧒');
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
    <div className="bg-white rounded-3xl p-4 shadow-card border border-slate-100 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-bold text-slate-800">孩子档案管理</div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1 text-xs text-brand-600 bg-brand-50 hover:bg-brand-100 font-semibold px-3 py-1.5 rounded-full transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>添加孩子</span>
        </button>
      </div>

      {/* 孩子卡片列表 */}
      <div className="flex flex-col gap-2">
        {childrenList.map((child) => {
          const isCurrent = child.id === currentChildId;
          return (
            <div
              key={child.id}
              className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                isCurrent
                  ? 'border-brand-300 bg-brand-50/40 ring-1 ring-brand-300'
                  : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50'
              }`}
            >
              <div
                onClick={() => onSelectChild(child.id)}
                className="flex items-center gap-2.5 flex-1 cursor-pointer"
              >
                <span className="text-2xl">{child.avatar || '👶'}</span>
                <div>
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span>{child.name}</span>
                    {isCurrent && (
                      <span className="text-[10px] bg-brand-500 text-white font-medium px-1.5 py-0.2 rounded-full">
                        当前选中
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400">{child.grade || '未填班级'}</div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenEdit(child)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-white"
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
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl flex flex-col gap-3.5"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-sm font-bold text-slate-800">
                {editingId ? '编辑孩子档案' : '添加孩子档案'}
              </span>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {/* 头像选择 */}
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1.5">选择头像</label>
              <div className="flex items-center gap-2 overflow-x-auto py-1">
                {AVATAR_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setAvatar(emoji)}
                    className={`text-xl p-2 rounded-xl border transition-all ${
                      avatar === emoji
                        ? 'border-brand-500 bg-brand-50 scale-110'
                        : 'border-slate-100 hover:bg-slate-50'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* 姓名 */}
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">孩子昵称/姓名</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：豆豆 / 涵涵"
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* 班级/学校 */}
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">所在班级 / 学校</label>
              <input
                type="text"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="例如：小学一年级 (2) 班"
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs rounded-xl shadow-float transition-all active:scale-98 mt-1"
            >
              保存档案
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
