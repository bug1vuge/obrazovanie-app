import { CircleAlert, CircleCheck } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useOverlayRoot } from '@/device/overlay';
import { cn } from '@/shared/lib/cn';
import { useToasts } from './toastStore';

export function Toaster() {
  const toasts = useToasts((state) => state.toasts);
  const dismiss = useToasts((state) => state.dismiss);
  const overlayRoot = useOverlayRoot();
  return createPortal(
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-0 z-[80] flex flex-col items-center gap-2 px-4 pt-[calc(var(--safe-top)+0.6rem)]"
    >
      {toasts.map((toast) => (
        <button
          key={toast.id}
          type="button"
          role={toast.tone === 'error' ? 'alert' : 'status'}
          onClick={() => dismiss(toast.id)}
          className={cn(
            'toast pointer-events-auto flex w-full max-w-sm items-center gap-2.5 rounded-2xl px-4 py-3 text-left text-[13.5px] font-medium shadow-[0_18px_40px_-16px_rgb(0_0_0/0.5)]',
            'bg-[rgb(var(--ink))] text-[rgb(var(--color-bg))]',
          )}
        >
          {toast.tone === 'error' ? (
            <CircleAlert size={18} className="shrink-0 text-red-400" aria-hidden />
          ) : (
            <CircleCheck size={18} className="shrink-0 text-emerald-400" aria-hidden />
          )}
          {toast.text}
        </button>
      ))}
    </div>,
    overlayRoot,
  );
}
