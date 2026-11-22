import type { LucideIcon } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

export interface TabItem<T extends string> {
  id: T;
  label: string;
  icon?: LucideIcon;
}

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  label,
}: {
  tabs: readonly TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div role="tablist" aria-label={label} className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
      {tabs.map(({ id, label: tabLabel, icon: Icon }) => {
        const active = id === value;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            id={`tab-${id}`}
            aria-selected={active}
            aria-controls={`panel-${id}`}
            onClick={() => onChange(id)}
            className={cn('chip !px-4 !py-2 !text-[13.5px]', active ? 'chip-on' : 'hover-line')}
          >
            {Icon && <Icon size={15} aria-hidden />}
            {tabLabel}
          </button>
        );
      })}
    </div>
  );
}
