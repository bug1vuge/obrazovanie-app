import { cn } from '@/shared/lib/cn';

export function ProgressBar({
  value = 0,
  thin = false,
  className,
  label = 'Прогресс',
}: {
  value?: number;
  thin?: boolean;
  className?: string;
  label?: string;
}) {
  const percent = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      className={cn(
        'soft-bg w-full overflow-hidden rounded-full',
        thin ? 'h-1.5' : 'h-2.5',
        className,
      )}
    >
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{
          width: `${percent}%`,
          background:
            'linear-gradient(90deg, rgb(var(--color-primary)), rgb(var(--color-secondary)))',
        }}
      />
    </div>
  );
}
