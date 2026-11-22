import { GraduationCap } from 'lucide-react';
import { useEffect, useState } from 'react';

export const SPLASH_MS = 1100;

/** Launch screen shown over the app while it "starts", like a native splash. */
export function SplashScreen() {
  const [phase, setPhase] = useState<'shown' | 'hiding' | 'gone'>('shown');

  useEffect(() => {
    const hide = setTimeout(() => setPhase('hiding'), SPLASH_MS);
    const remove = setTimeout(() => setPhase('gone'), SPLASH_MS + 400);
    return () => {
      clearTimeout(hide);
      clearTimeout(remove);
    };
  }, []);

  if (phase === 'gone') return null;
  return (
    <div
      aria-hidden
      className="duration-400 absolute inset-0 z-[90] flex flex-col items-center justify-center gap-4 transition-opacity"
      style={{
        opacity: phase === 'hiding' ? 0 : 1,
        background:
          'linear-gradient(150deg, rgb(var(--color-primary)), rgb(var(--color-secondary)))',
      }}
    >
      <span className="rise flex h-24 w-24 items-center justify-center rounded-[28px] bg-white/15 text-white shadow-2xl backdrop-blur">
        <GraduationCap size={48} />
      </span>
      <span
        className="font-display rise text-[26px] text-white"
        style={{ animationDelay: '120ms' }}
      >
        Study Pro
      </span>
      <span className="rise text-[13px] text-white/75" style={{ animationDelay: '220ms' }}>
        Подготовка к ОГЭ и ЕГЭ
      </span>
    </div>
  );
}
