import { BatteryFull, Signal, Wifi } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import type { Platform } from './deviceStore';

/** Emulated status bar, only rendered inside the desktop demo frame. */
export function StatusBar({ platform }: { platform: Platform }) {
  const ios = platform === 'ios';
  return (
    <div
      aria-hidden
      className={cn(
        'relative z-40 flex shrink-0 items-center justify-between font-semibold',
        ios ? 'h-[50px] px-8 pt-1 text-[15px]' : 'h-9 px-5 text-[13px]',
      )}
    >
      <span className="tabular-nums">{ios ? '9:41' : '12:30'}</span>
      {ios ? (
        <span className="absolute left-1/2 top-[11px] h-[30px] w-[118px] -translate-x-1/2 rounded-full bg-black" />
      ) : (
        <span className="absolute left-1/2 top-2.5 h-4 w-4 -translate-x-1/2 rounded-full bg-black" />
      )}
      <span className="flex items-center gap-1.5">
        <Signal size={ios ? 16 : 14} strokeWidth={2.5} />
        <Wifi size={ios ? 16 : 14} strokeWidth={2.5} />
        <BatteryFull size={ios ? 22 : 18} strokeWidth={2} />
      </span>
    </div>
  );
}
