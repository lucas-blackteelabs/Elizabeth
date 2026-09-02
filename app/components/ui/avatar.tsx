import { KID_COLOURS } from '@/lib/utils/time';
import { cn } from '@/lib/utils/cn';
export const Avatar = ({ name, index, size = 'md' }: { name: string; index: number; size?: 'sm' | 'md' | 'lg' }) => (
  <span
    className={cn('grid shrink-0 place-items-center rounded-full font-bold text-white', size === 'sm' ? 'h-6 w-6 text-[11px]' : size === 'lg' ? 'h-10 w-10 text-base' : 'h-[34px] w-[34px] text-sm')}
    style={{ background: KID_COLOURS[Math.max(0, index) % KID_COLOURS.length] }}
    title={name}
  >
    {name.charAt(0)}
  </span>
);
