'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarBlank, Gear, MoonStars, PaperPlaneTilt, Star } from '@phosphor-icons/react';
import { appRoutes } from '@/config/appRoutes';
import { useHousehold } from '@/hooks/household.hooks';
import { useBrief } from '@/hooks/brief.hooks';
import { fmtLongDay } from '@/lib/utils/time';
import { cn } from '@/lib/utils/cn';

const TABS = [
  { href: appRoutes.tonight, label: 'Tonight', Icon: MoonStars },
  { href: appRoutes.week, label: 'Week', Icon: CalendarBlank },
  { href: appRoutes.kids, label: 'Kids', Icon: Star },
  { href: appRoutes.send, label: 'Send', Icon: PaperPlaneTilt },
];

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const { data } = useHousehold();
  const { data: brief } = useBrief(!!data);
  const h = data?.household;
  return (
    <div className="mx-auto max-w-[640px] px-[18px] pb-28">
      <header className="flex items-center justify-between pt-6 pb-2">
        <div>
          <div className="font-display text-[17px] font-bold">{h?.name ?? '…'}</div>
          <div className="text-sm text-muted">{brief ? fmtLongDay(brief.generatedAt) : ''}{h?.demo ? ' · demo family' : ''}</div>
        </div>
        <Link href={appRoutes.settings} aria-label="Settings" className="grid h-10 w-10 place-items-center rounded-full bg-soft"><Gear size={20} /></Link>
      </header>
      <main>{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto flex max-w-[640px]">
          {TABS.map(({ href, label, Icon }) => {
            const on = pathname.startsWith(href);
            return (
              <Link key={href} href={href} className={cn('relative grid flex-1 justify-items-center gap-0.5 py-2.5 text-[11px] font-semibold', on ? 'text-ink' : 'text-muted')}>
                <Icon size={24} weight={on ? 'fill' : 'regular'} />
                {label}
                {href === appRoutes.tonight && brief?.decide.length ? <span className="absolute top-1 ml-7 grid h-4 min-w-4 place-items-center rounded-full bg-need px-1 text-[10px] text-white">{brief.decide.length}</span> : null}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
