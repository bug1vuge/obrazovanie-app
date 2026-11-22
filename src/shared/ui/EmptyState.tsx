import { Inbox, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export function EmptyState({
  icon: Icon = Inbox,
  title,
  text,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  text?: string;
  action?: ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
      <span className="soft-bg flex h-12 w-12 items-center justify-center rounded-2xl">
        <Icon size={22} className="muted" />
      </span>
      <div>
        <p className="font-display text-base">{title}</p>
        {text && <p className="muted mt-1 text-sm">{text}</p>}
      </div>
      {action}
    </div>
  );
}
