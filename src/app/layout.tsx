import type { Metadata, Viewport } from 'next';
import './globals.css';
import { BottomNav } from '@/components/layout/BottomNav';
import { AuthBoundary } from '@/components/auth/AuthBoundary';

export const metadata: Metadata = {
  title: '伴学小账 · BentoCare - 孩子在校/托管考勤退费记账本',
  description: '面向家庭与小饭桌托管的考勤打卡与缺勤退费自动核算工具',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '伴学小账',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="bg-stone-100 text-stone-800 min-h-screen flex justify-center antialiased selection:bg-brand-500 selection:text-white">
        <AuthBoundary>
          {children}
          <BottomNav />
        </AuthBoundary>
      </body>
    </html>
  );
}
