import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Reveal } from './Reveal';

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <Reveal className="card p-4">
      <Icon size={15} className="muted" aria-hidden />
      <p className="font-display mt-1.5 whitespace-nowrap text-[clamp(0.85rem,3.8vw,1.25rem)] leading-none">
        {value}
      </p>
      <p className="muted mt-1 text-[11.5px]">{label}</p>
      {hint && <div className="mt-1.5 text-[11.5px]">{hint}</div>}
    </Reveal>
  );
}
