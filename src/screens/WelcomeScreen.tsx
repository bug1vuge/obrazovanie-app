import { Award, BookOpen, Coins, type LucideIcon } from 'lucide-react';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { markOnboarded } from '@/app/onboarding';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui';

interface Slide {
  icon: LucideIcon;
  title: string;
  text: string;
  from: string;
  to: string;
}

const SLIDES: readonly Slide[] = [
  {
    icon: BookOpen,
    title: 'Подготовься к ОГЭ и ЕГЭ',
    text: 'Курсы по 12 школьным предметам: короткая теория и разбор реальных заданий.',
    from: '#5b47d6',
    to: '#a855f7',
  },
  {
    icon: Award,
    title: 'Тесты и понятный прогресс',
    text: 'Тест после каждого модуля, прогресс сохраняется, а в конце — именной сертификат.',
    from: '#f0663a',
    to: '#f7b23b',
  },
  {
    icon: Coins,
    title: 'Преподавай и зарабатывай',
    text: 'Соберите свой курс, назначьте цену и следите за доходом в личном кабинете.',
    from: '#0f766e',
    to: '#34d399',
  },
];

/** First-launch onboarding with swipeable slides. */
export function WelcomeScreen() {
  const navigate = useNavigate();
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const last = index === SLIDES.length - 1;

  const goTo = (next: number) => {
    const track = trackRef.current;
    if (track) track.scrollTo?.({ left: next * track.clientWidth, behavior: 'smooth' });
    setIndex(next);
  };

  const finish = () => {
    markOnboarded();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex h-full flex-col pt-[var(--safe-top)]">
      <div className="flex justify-end px-4 pt-2">
        <button
          type="button"
          onClick={finish}
          className="pressable muted px-2 py-2 text-[15px] font-medium"
        >
          Пропустить
        </button>
      </div>
      <div
        ref={trackRef}
        className="flex min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto"
        onScroll={(event) => {
          const track = event.currentTarget;
          setIndex(Math.round(track.scrollLeft / Math.max(1, track.clientWidth)));
        }}
        aria-roledescription="карусель"
      >
        {SLIDES.map(({ icon: Icon, title, text, from, to }, slideIndex) => (
          <section
            key={title}
            aria-label={`${slideIndex + 1} из ${SLIDES.length}`}
            className="flex w-full shrink-0 snap-center flex-col items-center justify-center px-8 text-center"
          >
            <div
              className="flex h-48 w-48 items-center justify-center rounded-[48px] text-white shadow-2xl"
              style={{ background: `linear-gradient(140deg, ${from}, ${to})` }}
            >
              <Icon size={84} strokeWidth={1.6} aria-hidden />
            </div>
            <h1 className="font-display mt-10 text-[26px] leading-tight">{title}</h1>
            <p className="muted mt-3 max-w-xs text-[15px] leading-relaxed">{text}</p>
          </section>
        ))}
      </div>
      <div className="flex flex-col items-center gap-6 px-6 pb-[calc(1.5rem+var(--safe-bottom))]">
        <div className="flex gap-2" aria-hidden>
          {SLIDES.map((slide, dot) => (
            <span
              key={slide.title}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                dot === index ? 'w-6 bg-secondary' : 'w-2 bg-[rgb(var(--line)/0.2)]',
              )}
            />
          ))}
        </div>
        <Button size="lg" className="w-full" onClick={() => (last ? finish() : goTo(index + 1))}>
          {last ? 'Начать' : 'Далее'}
        </Button>
      </div>
    </div>
  );
}
