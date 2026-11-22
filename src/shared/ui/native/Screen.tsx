import { ArrowLeft, ChevronLeft } from 'lucide-react';
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { usePlatform } from '@/device/deviceStore';
import { useGoBack } from '@/shared/hooks/useGoBack';
import { cn } from '@/shared/lib/cn';
import { recallScroll, rememberScroll } from './scrollMemory';

interface ScreenProps {
  title: string;
  /** iOS large title inside the content that collapses into the bar on scroll. */
  largeTitle?: boolean;
  /** Show a back button; the value is the fallback route when there is no history. */
  back?: string;
  /** Buttons on the right side of the navigation bar. */
  actions?: ReactNode;
  /** Sticky bottom area (call-to-action bar). */
  footer?: ReactNode;
  /** Content shown under a transparent bar (e.g. a course cover). */
  hero?: boolean;
  children: ReactNode;
  /** Extra bottom space when the screen sits above the tab bar. */
  withTabBar?: boolean;
}

/**
 * A native-like screen: navigation bar (iOS or Android style), its own scroll
 * container with remembered position, optional sticky footer.
 */
export function Screen({
  title,
  largeTitle = false,
  back,
  actions,
  footer,
  hero = false,
  children,
  withTabBar = false,
}: ScreenProps) {
  const platform = usePlatform();
  const ios = platform === 'ios';
  const location = useLocation();
  const goBack = useGoBack(back ?? '/');
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const showLargeTitle = largeTitle && ios;
  const threshold = hero ? 180 : showLargeTitle ? 36 : 4;

  useLayoutEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    const key = location.key + location.pathname;
    const top = recallScroll(key);
    if (top) element.scrollTop = top;
    setScrolled(top > threshold);
    return () => rememberScroll(key, element.scrollTop);
  }, [location.key, location.pathname, threshold]);

  const BackIcon = ios ? ChevronLeft : ArrowLeft;
  const barSolid = !hero || scrolled;

  return (
    <div className="flex h-full flex-col">
      <header
        className={cn(
          'z-20 flex shrink-0 items-center gap-1 pt-[var(--safe-top)] transition-[background-color,border-color] duration-200',
          hero && 'absolute inset-x-0 top-0',
          barSolid ? 'glass' : 'bg-transparent',
          barSolid && scrolled ? 'hairline-b' : 'border-b border-transparent',
          ios ? 'h-[calc(44px+var(--safe-top))] px-2' : 'h-[calc(56px+var(--safe-top))] px-1',
        )}
      >
        <div className={cn('flex items-center', ios ? 'min-w-[88px]' : '')}>
          {back !== undefined && (
            <button
              type="button"
              onClick={goBack}
              aria-label="Назад"
              className={cn(
                'pressable flex items-center',
                !barSolid && 'rounded-full bg-black/35 text-white backdrop-blur',
                ios
                  ? 'h-9 gap-0.5 rounded-full pl-1 pr-3 text-[16px]'
                  : 'h-12 w-12 justify-center rounded-full',
                barSolid && ios && 'text-primary',
                !barSolid && ios && 'pr-1',
              )}
            >
              <BackIcon size={ios ? 26 : 22} strokeWidth={ios ? 2.4 : 2} aria-hidden />
              {ios && barSolid && <span>Назад</span>}
            </button>
          )}
        </div>
        <h1
          className={cn(
            'min-w-0 flex-1 truncate font-semibold transition-opacity duration-200',
            ios ? 'text-center text-[16.5px]' : 'pl-2 text-[20px]',
            back === undefined && !ios && 'pl-4',
            (showLargeTitle || hero) && !scrolled ? 'opacity-0' : 'opacity-100',
          )}
        >
          {title}
        </h1>
        <div
          className={cn('flex items-center justify-end gap-1', ios ? 'min-w-[88px] pr-1' : 'pr-1')}
        >
          {actions}
        </div>
      </header>

      <div
        ref={scrollRef}
        data-scroll-container
        onScroll={(event) => setScrolled(event.currentTarget.scrollTop > threshold)}
        className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain"
      >
        {showLargeTitle && (
          <h2 aria-hidden className="font-display px-4 pb-1 pt-1 text-[30px] leading-tight">
            {title}
          </h2>
        )}
        {children}
        <div
          className={withTabBar ? 'h-6' : footer ? 'h-4' : 'h-[calc(1.5rem+var(--safe-bottom))]'}
        />
      </div>

      {footer && (
        <div className="glass hairline-t z-20 shrink-0 px-4 pb-[calc(0.75rem+var(--safe-bottom))] pt-3">
          {footer}
        </div>
      )}
    </div>
  );
}
