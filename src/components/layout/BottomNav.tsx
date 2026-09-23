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
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#faf9f6]/95 backdrop-blur-sm border-t border-stone-200/80 pb-safe">
      <div className="max-w-md mx-auto flex items-center justify-around h-14 px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 py-1 transition-colors select-none',
                item.active
                  ? 'text-brand-600 font-semibold'
                  : 'text-stone-400 hover:text-stone-600'
              )}
            >
              <Icon
                className={cn(
                  'w-4 h-4 transition-transform',
                  item.active ? 'text-brand-600 stroke-[2.2]' : 'text-stone-400 stroke-[1.8]'
                )}
              />
              <span
                className={cn(
                  'text-[10px] mt-1 tracking-tight',
                  item.active ? 'text-brand-600' : 'text-stone-400'
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
