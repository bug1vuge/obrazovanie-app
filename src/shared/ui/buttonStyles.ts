import { cn } from '@/shared/lib/cn';

export type ButtonVariant = 'primary' | 'accent' | 'soft' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-primary on-primary hover:brightness-110',
  accent: 'bg-secondary text-white hover:brightness-105',
  soft: 'soft-bg ink hover:brightness-[0.97]',
  outline: 'bd hover-line ink',
  ghost: 'hover-dim ink',
  danger: 'bg-red-600 text-white hover:bg-red-700',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'text-[13px] px-3.5 py-2 gap-1.5',
  md: 'text-[14.5px] px-5 py-2.5 gap-2',
  lg: 'text-[15.5px] px-6 py-3 gap-2',
};

export function buttonClassName(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  className?: string,
) {
  return cn(
    'inline-flex items-center justify-center rounded-full font-medium transition active:scale-[0.985] disabled:pointer-events-none disabled:opacity-50',
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}
