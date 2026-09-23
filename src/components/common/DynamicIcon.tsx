'use client';

import React from 'react';
import {
  Utensils,
  Home,
  Bus,
  BookOpen,
  Coffee,
  Palette,
  Activity,
  Apple,
  Sandwich,
  Clock,
  Smile,
  User,
  Baby,
  Heart,
  Star,
  Sun,
  GraduationCap,
  Sparkles,
  HelpCircle,
  LucideProps,
} from 'lucide-react';

export const ICON_MAP: Record<string, React.ComponentType<LucideProps>> = {
  // Service item icons
  Utensils,
  Home,
  Bus,
  BookOpen,
  Coffee,
  Palette,
  Activity,
  Apple,
  Sandwich,
  Clock,

  // Child avatar icons
  Smile,
  User,
  Baby,
  Heart,
  Star,
  Sun,
  GraduationCap,
  Sparkles,
};

// 兼容历史数据中的 Emoji，平滑映射到对应 Lucide Icon
export const EMOJI_TO_ICON_MAP: Record<string, string> = {
  '🍱': 'Utensils',
  '🏠': 'Home',
  '🚌': 'Bus',
  '📚': 'BookOpen',
  '🥛': 'Coffee',
  '🎨': 'Palette',
  '⚽': 'Activity',
  '🍎': 'Apple',
  '🥪': 'Sandwich',
  '🧸': 'Heart',
  '🧒': 'Smile',
  '👧': 'Smile',
  '👶': 'Baby',
  '👦': 'User',
  '🧑‍🎓': 'GraduationCap',
  '🐣': 'Sun',
  '🐰': 'Heart',
  '🐼': 'Star',
};

// 供选择器使用的列表
export const AVATAR_ICON_KEYS = [
  'Smile',
  'User',
  'Baby',
  'Heart',
  'Star',
  'Sun',
  'GraduationCap',
  'Sparkles',
];

export const SERVICE_ITEM_ICON_KEYS = [
  'Utensils',
  'Home',
  'Bus',
  'BookOpen',
  'Coffee',
  'Palette',
  'Activity',
  'Apple',
  'Sandwich',
  'Clock',
];

interface DynamicIconProps extends LucideProps {
  name?: string;
  fallback?: React.ComponentType<LucideProps>;
}

export function DynamicIcon({
  name = '',
  fallback: FallbackIcon = HelpCircle,
  ...props
}: DynamicIconProps) {
  if (!name) {
    return <FallbackIcon {...props} />;
  }

  // 若传入的是历史 emoji，先尝试转换
  const iconKey = EMOJI_TO_ICON_MAP[name] || name;
  const IconComponent = ICON_MAP[iconKey] || FallbackIcon;

  return <IconComponent {...props} />;
}
