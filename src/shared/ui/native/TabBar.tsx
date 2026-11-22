import type { LucideIcon } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { usePlatform } from '@/device/deviceStore';
import { cn } from '@/shared/lib/cn';

export interface TabItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

/** iOS tab bar or Android (Material 3) navigation bar. */
export function TabBar({ items }: { items: readonly TabItem[] }) {
  const ios = usePlatform() === 'ios';
  return (
    <nav
      aria-label="Нижняя навигация"
      className={cn(
        'z-30 flex shrink-0 pb-[var(--safe-bottom)]',
        ios ? 'glass hairline-t' : 'soft-bg',
      )}
    >
      {items.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          replace
          className={({ isActive }) =>
            cn(
              'pressable flex flex-1 flex-col items-center',
              ios
                ? 'gap-0.5 pb-1 pt-2 text-[10.5px] font-medium'
                : 'gap-1 pb-3 pt-3 text-[12px] font-semibold',
              isActive ? (ios ? 'text-primary' : 'ink') : 'muted',
            )
          }
        >
          {({ isActive }) => (
            <>
              <span
                className={cn(
                  'flex items-center justify-center transition-colors',
                  !ios && 'h-8 w-16 rounded-full',
                  !ios && isActive && 'bg-secondary/25',
                )}
              >
                <Icon size={ios ? 25 : 22} strokeWidth={isActive ? 2.3 : 1.9} aria-hidden />
              </span>
              {label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
