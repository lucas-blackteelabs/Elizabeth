'use client';
import * as RadixSwitch from '@radix-ui/react-switch';
import { cn } from '@/lib/utils/cn';
export const Switch = ({ checked, onCheckedChange, label }: { checked: boolean; onCheckedChange: (v: boolean) => void; label?: string }) => (
  <RadixSwitch.Root checked={checked} onCheckedChange={onCheckedChange} aria-label={label} className={cn('relative h-7 w-[46px] rounded-full transition', checked ? 'bg-done' : 'bg-line')}>
    <RadixSwitch.Thumb className={cn('block h-[22px] w-[22px] translate-x-[3px] rounded-full bg-white transition', checked && 'translate-x-[21px]')} />
  </RadixSwitch.Root>
);
