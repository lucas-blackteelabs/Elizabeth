import { cn } from '@/lib/utils/cn';
export const Card = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('rounded-card border border-line bg-surface p-5 shadow-card', className)} {...props} />
);
export const Group = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('rounded-card border border-line bg-surface px-5 py-1', className)} {...props} />
);
export const SectionTitle = ({ children, count }: { children: React.ReactNode; count?: number }) => (
  <h2 className="mt-7 mb-3 text-[13px] font-bold tracking-[0.08em] text-muted uppercase">
    {children}
    {count ? <span className="ml-2 inline-grid h-5 min-w-5 place-items-center rounded-full bg-need-soft px-1.5 text-xs text-need">{count}</span> : null}
  </h2>
);
