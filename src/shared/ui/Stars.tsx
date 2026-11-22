import { Star } from 'lucide-react';

interface StarsProps {
  value?: number;
  count?: string;
  size?: number;
  /** Makes the stars interactive (rating input). */
  onPick?: (value: number) => void;
}

export function Stars({ value = 0, count, size = 14, onPick }: StarsProps) {
  const rounded = Math.round((Number(value) || 0) * 2) / 2;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-flex items-center gap-0.5"
        role={onPick ? 'radiogroup' : 'img'}
        aria-label={onPick ? 'Оценка' : `Рейтинг ${rounded} из 5`}
      >
        {[1, 2, 3, 4, 5].map((index) => {
          const filled = rounded >= index - 0.5;
          if (onPick) {
            return (
              <button
                key={index}
                type="button"
                role="radio"
                aria-checked={Math.round(rounded) === index}
                aria-label={`${index} из 5`}
                onClick={() => onPick(index)}
                className="p-0.5"
              >
                <Star
                  size={size + 6}
                  className={filled ? 'text-secondary' : 'muted'}
                  fill={filled ? 'currentColor' : 'none'}
                />
              </button>
            );
          }
          return (
            <Star
              key={index}
              size={size}
              aria-hidden
              className={filled ? 'text-secondary' : 'muted opacity-45'}
              fill={filled ? 'currentColor' : 'none'}
            />
          );
        })}
      </span>
      {count && <span className="muted text-xs">{count}</span>}
    </span>
  );
}
