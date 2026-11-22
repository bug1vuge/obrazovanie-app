import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

/** Inline status message (polite live region). */
export function Notice({
  children,
  tone = 'info',
  className,
}: {
  children: ReactNode;
  tone?: 'info' | 'error';
  className?: string;
}) {
  return (
    <p
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'rounded-xl px-3 py-2 text-[12.5px] leading-snug',
        tone === 'error' ? 'bg-red-500/10 text-red-600 dark:text-red-400' : 'bg-secondary/[0.12]',
        className,
      )}
    >
      {children}
    </p>
  );
}
