'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarCheck2, ReceiptText, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    {
      href: '/',
      label: '考勤打卡',
      icon: CalendarCheck2,
      active: pathname === '/',
    },
    {
      href: '/bills',
      label: '对账单',
      icon: ReceiptText,
      active: pathname === '/bills',
    },
    {
      href: '/settings',
      label: '配置中心',
      icon: Settings2,
      active: pathname === '/settings',
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-100 shadow-lg pb-safe">
      <div className="max-w-md mx-auto flex items-center justify-around h-16 px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 py-1 transition-all duration-200 select-none',
                item.active
                  ? 'text-brand-600 font-semibold scale-105'
                  : 'text-slate-400 hover:text-slate-600'
              )}
            >
              <div
                className={cn(
                  'relative p-1 rounded-full transition-colors',
                  item.active && 'bg-brand-50 text-brand-600'
                )}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[11px] mt-0.5 tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
