import { NextResponse } from 'next/server';
import { BUILTIN_HOLIDAYS_MAP, HolidayItem } from '@/lib/holiday-data';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get('year') || String(new Date().getFullYear());

  // 1. 优先尝试从稳定国内高速 CDN 镜像 (NateScarlet/holiday-cn) 拉取最新官方节假日
  const cdnUrl = `https://cdn.jsdelivr.net/gh/NateScarlet/holiday-cn@master/${year}.json`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4秒超时

    const response = await fetch(cdnUrl, {
      signal: controller.signal,
      next: { revalidate: 86400 }, // 缓存 24 小时
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data && Array.isArray(data.days)) {
        const holidays: HolidayItem[] = data.days.map((d: any) => ({
          name: d.name,
          date: d.date,
          isOffDay: Boolean(d.isOffDay),
        }));

        return NextResponse.json({
          success: true,
          year: Number(year),
          source: 'holiday-cn-cdn',
          data: holidays,
        });
      }
    }
  } catch (err: any) {
    console.warn(`Fetch holidays from CDN for year ${year} failed, using builtin fallback:`, err?.message);
  }

  // 2. 网络无法访问或拉取失败时，回退到本地内置权威底座
  const fallbackList: HolidayItem[] = Object.values(BUILTIN_HOLIDAYS_MAP).filter((h) =>
    h.date.startsWith(`${year}-`)
  );

  return NextResponse.json({
    success: true,
    year: Number(year),
    source: 'builtin-fallback',
    data: fallbackList,
  });
}
