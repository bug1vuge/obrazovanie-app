import { Check, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/shared/lib/cn';
import { Sheet } from './Sheet';

export interface PickerOption<T extends string> {
  value: T;
  label: string;
}

interface PickerFieldProps<T extends string> {
  value: T;
  options: readonly PickerOption<T>[];
  onChange: (value: T) => void;
  /** Title of the picker sheet. */
  title: string;
  id?: string;
  className?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

/**
 * Select replacement in the native mobile style: a field that opens a bottom
 * sheet with the options (like iOS action sheets / Android menus).
 */
export function PickerField<T extends string>({
  value,
  options,
  onChange,
  title,
  id,
  className,
  ...aria
}: PickerFieldProps<T>) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <>
      <button
        id={id}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className={cn('inp pressable flex items-center justify-between gap-2 text-left', className)}
        {...aria}
      >
        <span className="min-w-0 truncate">{selected?.label ?? ''}</span>
        <ChevronDown size={16} className="muted shrink-0" aria-hidden />
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title={title}>
        <ul role="listbox" aria-label={title} className="flex flex-col pb-2">
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <li key={option.value} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  onClick={() => {
                    if (!isSelected) onChange(option.value);
                    setOpen(false);
                  }}
                  className={cn(
                    'pressable hairline-b flex w-full items-center justify-between gap-3 py-3.5 text-left text-[15.5px]',
                    isSelected && 'font-semibold',
                  )}
                >
                  {option.label}
                  {isSelected && (
                    <Check size={18} className="shrink-0 text-secondary" aria-hidden />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </Sheet>
    </>
  );
}
