import { ExternalLink, GraduationCap, Moon, RotateCcw, Smartphone, Sun } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { useMediaQuery } from '@/shared/hooks/useMediaQuery';
import { Segmented } from '@/shared/ui';
import { useAppStore } from '@/store/appStore';
import { useThemeStore } from '@/store/themeStore';
import { useDeviceStore, type Platform } from './deviceStore';
import { OverlayRootContext } from './overlay';
import { StatusBar } from './StatusBar';

/** Must match the media query in index.css that draws the phone frame. */
export const FRAMED_QUERY = '(min-width: 640px) and (min-height: 700px)';

export const WEBSITE_URL = 'https://bug1vuge.github.io/obrazovanie/';

const PLATFORM_OPTIONS = [
  { id: 'ios', label: 'iOS' },
  { id: 'android', label: 'Android' },
] as const satisfies readonly { id: Platform; label: string }[];

function DemoPanel() {
  const platform = useDeviceStore((state) => state.platform);
  const setPlatform = useDeviceStore((state) => state.setPlatform);
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const resetDemo = useAppStore((state) => state.resetDemo);

  return (
    <aside className="hidden w-[300px] shrink-0 flex-col gap-5 lg:flex" aria-label="Параметры демо">
      <div className="flex items-center gap-3">
        <span
          className="flex h-12 w-12 items-center justify-center rounded-2xl text-white"
          style={{
            background:
              'linear-gradient(140deg, rgb(var(--color-primary)), rgb(var(--color-secondary)))',
          }}
        >
          <GraduationCap size={24} aria-hidden />
        </span>
        <div>
          <p className="font-display text-[19px] leading-tight">Study Pro</p>
          <p className="muted text-[13px]">Мобильное приложение · демо</p>
        </div>
      </div>
      <p className="muted text-[13.5px] leading-relaxed">
        Кликабельный макет приложения для iOS и Android. Все сценарии работают: каталог, покупка
        курса, уроки и тесты, кабинет ученика и преподавателя, модерация.
      </p>
      <div>
        <p className="muted mb-2 text-[11.5px] font-semibold uppercase tracking-wider">Платформа</p>
        <Segmented
          label="Платформа"
          value={platform}
          options={PLATFORM_OPTIONS}
          onChange={setPlatform}
        />
      </div>
      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={toggleTheme}
          className="hover-dim flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium"
        >
          {theme === 'dark' ? <Sun size={17} aria-hidden /> : <Moon size={17} aria-hidden />}
          {theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
        </button>
        <button
          type="button"
          onClick={() => {
            resetDemo();
            localStorage.removeItem('studypro-app-onboarded');
            window.location.hash = '#/';
            window.location.reload();
          }}
          className="hover-dim flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium"
        >
          <RotateCcw size={17} aria-hidden /> Начать демо заново
        </button>
        <a
          href={WEBSITE_URL}
          target="_blank"
          rel="noreferrer"
          className="hover-dim flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium"
        >
          <ExternalLink size={17} aria-hidden /> Открыть сайт
        </a>
      </div>
      <p className="soft-bg flex items-start gap-2.5 rounded-2xl p-3.5 text-[12.5px] leading-relaxed">
        <Smartphone size={16} className="mt-0.5 shrink-0" aria-hidden />
        Откройте эту ссылку на телефоне — приложение займёт весь экран. В Safari и Chrome его можно
        добавить на главный экран как обычное приложение.
      </p>
    </aside>
  );
}

/**
 * Renders the app full-screen on phones and inside a phone frame on larger
 * screens (with a demo panel to switch platform and theme).
 */
export function DeviceFrame({ children }: { children: ReactNode }) {
  const platform = useDeviceStore((state) => state.platform);
  const framed = useMediaQuery(FRAMED_QUERY);
  const [overlayRoot, setOverlayRoot] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    document.documentElement.dataset.platform = platform;
  }, [platform]);

  return (
    <div className="stage">
      {framed && <DemoPanel />}
      <div className="device" data-platform={platform}>
        <div className="device-screen">
          {framed && <StatusBar platform={platform} />}
          <OverlayRootContext.Provider value={overlayRoot}>
            {/* The content area contains fixed-position overlays (transform), so
                sheets and toasts never cover the emulated status bar. */}
            <div className="relative min-h-0 flex-1 [transform:translateZ(0)]">
              {overlayRoot && children}
              <div ref={setOverlayRoot} />
            </div>
          </OverlayRootContext.Provider>
          {framed && platform === 'ios' && (
            <span
              aria-hidden
              className="pointer-events-none absolute bottom-2 left-1/2 z-[70] h-[5px] w-[134px] -translate-x-1/2 rounded-full bg-[rgb(var(--ink))]"
            />
          )}
        </div>
      </div>
    </div>
  );
}
