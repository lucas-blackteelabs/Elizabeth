import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const button = cva('inline-flex items-center justify-center gap-2 rounded-full font-semibold transition active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-need', {
  variants: {
    variant: {
      primary: 'bg-accent text-accent-ink hover:brightness-110',
      secondary: 'border border-line bg-surface hover:border-muted/50',
      ghost: 'bg-transparent text-muted hover:bg-soft',
    },
    size: { sm: 'h-9 px-4 text-sm', md: 'h-11 px-5 text-[15px]', lg: 'h-13 px-6 text-base w-full' },
  },
  defaultVariants: { variant: 'secondary', size: 'md' },
});

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof button>;
export const Button = ({ className, variant, size, ...props }: ButtonProps) => <button className={cn(button({ variant, size }), className)} {...props} />;
