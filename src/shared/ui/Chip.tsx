import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';

export function Chip({
  active = false,
  className,
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type={type}
      aria-pressed={active}
      className={cn('chip', active ? 'chip-on' : 'hover-line', className)}
      {...props}
    />
  );
}
