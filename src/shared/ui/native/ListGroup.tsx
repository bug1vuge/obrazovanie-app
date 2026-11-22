import { ChevronRight, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

/** Inset grouped list (Settings-style). */
export function ListGroup({
  title,
  children,
  footer,
  className,
}: {
  title?: string;
  children: ReactNode;
  footer?: string;
  className?: string;
}) {
  return (
    <section className={cn('px-4', className)}>
      {title && (
        <h3 className="muted mb-1.5 px-1 text-[12px] font-semibold uppercase tracking-wider">
          {title}
        </h3>
      )}
      <ul className="card divide-y divide-[rgb(var(--line)/0.08)] overflow-hidden !rounded-[18px]">
        {children}
      </ul>
      {footer && <p className="muted mt-1.5 px-1 text-[12px] leading-snug">{footer}</p>}
    </section>
  );
}

interface ListRowProps {
  icon?: LucideIcon;
  iconTone?: string;
  label: ReactNode;
  detail?: ReactNode;
  value?: ReactNode;
  onClick?: () => void;
  chevron?: boolean;
  destructive?: boolean;
  trailing?: ReactNode;
}

export function ListRow({
  icon: Icon,
  iconTone = 'bg-primary',
  label,
  detail,
  value,
  onClick,
  chevron = Boolean(onClick),
  destructive = false,
  trailing,
}: ListRowProps) {
  const content = (
    <>
      {Icon && (
        <span
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] text-white',
            destructive ? 'bg-red-500' : iconTone,
          )}
        >
          <Icon size={17} aria-hidden />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className={cn('block truncate text-[15px]', destructive && 'text-red-500')}>
          {label}
        </span>
        {detail && <span className="muted block truncate text-[12.5px]">{detail}</span>}
      </span>
      {value !== undefined && <span className="muted shrink-0 text-[14px]">{value}</span>}
      {trailing}
      {chevron && <ChevronRight size={18} className="muted shrink-0 opacity-60" aria-hidden />}
    </>
  );
  return (
    <li>
      {onClick ? (
        <button
          type="button"
          onClick={onClick}
          className="pressable flex min-h-[52px] w-full items-center gap-3 px-4 py-2.5 text-left active:bg-[rgb(var(--line)/0.05)]"
        >
          {content}
        </button>
      ) : (
        <div className="flex min-h-[52px] items-center gap-3 px-4 py-2.5">{content}</div>
      )}
    </li>
  );
}
