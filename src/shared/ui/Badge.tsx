import type { ReactNode } from 'react';
import type { BadgeTone } from '@/entities/course/lib';
import { cn } from '@/shared/lib/cn';

const TONES: Record<BadgeTone, string> = {
  neutral: 'soft-bg muted',
  primary: 'bg-primary/10 text-primary',
  ok: 'bg-emerald-500/[0.12] text-emerald-700 dark:text-emerald-400',
  warn: 'bg-amber-500/15 text-amber-800 dark:text-amber-400',
  bad: 'bg-red-500/[0.12] text-red-600 dark:text-red-400',
};

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-semibold',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
