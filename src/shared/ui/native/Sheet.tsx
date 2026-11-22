import { X } from 'lucide-react';
import { useId, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useOverlayRoot } from '@/device/overlay';
import { useFocusTrap } from '@/shared/hooks/useFocusTrap';
import { cn } from '@/shared/lib/cn';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Full-height sheet for long forms. */
  tall?: boolean;
  className?: string;
}

const DISMISS_DISTANCE = 110;

/**
 * Native-style bottom sheet: slides up, can be swiped down by the grabber or
 * header, closes on backdrop tap and Escape, keeps focus inside.
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
  tall = false,
  className,
}: SheetProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ startY: number; pointerId: number } | null>(null);
  const [offset, setOffset] = useState(0);
  const overlayRoot = useOverlayRoot();
  useFocusTrap(panelRef, open, onClose);

  if (!open) return null;

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('button')) return;
    drag.current = { startY: event.clientY, pointerId: event.pointerId };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    setOffset(Math.max(0, event.clientY - drag.current.startY));
  };
  const onPointerUp = () => {
    if (!drag.current) return;
    drag.current = null;
    if (offset > DISMISS_DISTANCE) onClose();
    setOffset(0);
  };

  return createPortal(
    <div
      className="sheet-backdrop fixed inset-0 z-50 flex items-end bg-black/45"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={title ? undefined : 'Окно'}
        tabIndex={-1}
        className={cn(
          'sheet-panel surface flex w-full flex-col overflow-hidden rounded-t-[28px] shadow-2xl outline-none',
          tall ? 'h-[calc(100%-var(--safe-top)-28px)]' : 'max-h-[calc(100%-var(--safe-top)-28px)]',
          className,
        )}
        style={offset ? { transform: `translateY(${offset}px)`, transition: 'none' } : undefined}
      >
        <div
          className="shrink-0 touch-none select-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div className="flex justify-center pb-1 pt-2.5">
            <span className="h-[5px] w-10 rounded-full bg-[rgb(var(--line)/0.18)]" aria-hidden />
          </div>
          {title && (
            <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-1">
              <h2 id={titleId} className="font-display min-w-0 text-[17px]">
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="soft-bg -mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                aria-label="Закрыть"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-4">
          {children}
        </div>
        {footer && (
          <div className="hairline-t shrink-0 px-5 pb-[calc(0.85rem+var(--safe-bottom))] pt-3">
            {footer}
          </div>
        )}
        {!footer && <div className="shrink-0" style={{ height: 'var(--safe-bottom)' }} />}
      </div>
    </div>,
    overlayRoot,
  );
}
