import { cn } from '@/shared/lib/cn';

interface SegmentedProps<T extends string> {
  value: T | null;
  options: readonly { id: T; label: string; description?: string }[];
  onChange: (value: T) => void;
  label: string;
  size?: 'md' | 'lg';
}

/** Single-choice control rendered as a radio group of pills. */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
  size = 'md',
}: SegmentedProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="soft-bg grid auto-cols-fr grid-flow-col gap-1 rounded-2xl p-1"
    >
      {options.map((option) => {
        const active = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.id)}
            className={cn(
              'flex flex-col items-center justify-center rounded-xl font-semibold transition',
              size === 'lg' ? 'px-4 py-3 text-[17px]' : 'px-3 py-2 text-[14px]',
              active ? 'on-primary bg-primary shadow-sm' : 'muted hover:text-[rgb(var(--ink))]',
            )}
          >
            <span className={size === 'lg' ? 'font-display' : undefined}>{option.label}</span>
            {option.description && (
              <span className={cn('text-[11px] font-medium', active ? 'opacity-80' : 'muted')}>
                {option.description}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
