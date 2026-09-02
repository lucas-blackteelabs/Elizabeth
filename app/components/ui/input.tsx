import { cn } from '@/lib/utils/cn';
export const Input = ({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input className={cn('w-full rounded-inner border border-line bg-surface px-3.5 py-2.5 text-[15px] outline-none focus:border-muted', className)} {...props} />
);
export const Textarea = ({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea className={cn('min-h-36 w-full resize-y rounded-inner border border-line bg-surface px-3.5 py-2.5 text-[15px] leading-relaxed outline-none focus:border-muted', className)} {...props} />
);
export const Select = ({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select className={cn('rounded-inner border border-line bg-surface px-3 py-2.5 text-[15px]', className)} {...props} />
);
