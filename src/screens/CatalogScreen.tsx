import { ArrowRight, Moon, Search, Sparkles, Sun, X } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { ExamType } from '@/entities/types';
import { useRequireAuth } from '@/features/auth/useRequireAuth';
import {
  activeFilterCount,
  DEFAULT_FILTERS,
  EXAM_FILTER_OPTIONS,
  filterCourses,
  filtersFromParams,
  filtersToParams,
  SORT_OPTIONS,
  type CatalogFilters,
  type CatalogSort,
} from '@/features/catalog/filterCourses';
import { plural, WORDS } from '@/shared/lib/format';
import { Button, Chip, EmptyState, Reveal, Segmented } from '@/shared/ui';
import { PickerField, Screen } from '@/shared/ui/native';
import { useAppStore } from '@/store/appStore';
import { useCourseMetrics, useCourseStats, useCurrentUser } from '@/store/hooks';
import { getSubjectNames } from '@/store/selectors';
import { values } from '@/store/table';
import { useThemeStore } from '@/store/themeStore';
import { CourseCard } from '@/widgets/course-card/CourseCard';

const EXAM_SEGMENTS = EXAM_FILTER_OPTIONS.map((option) => ({
  id: option.id,
  label: option.id === 'all' ? 'Все' : option.label,
}));

export function CatalogScreen() {
  const db = useAppStore((state) => state.db);
  const updateProfile = useAppStore((state) => state.updateProfile);
  const user = useCurrentUser();
  const requireAuth = useRequireAuth();
  const navigate = useNavigate();
  const metrics = useCourseMetrics();
  const stats = useCourseStats();
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const [params, setParams] = useSearchParams();
  const filters = useMemo(() => filtersFromParams(params), [params]);

  const published = useMemo(
    () => values(db.courses).filter((course) => course.status === 'published'),
    [db.courses],
  );
  const subjects = useMemo(() => getSubjectNames(db), [db]);
  const visible = useMemo(
    () => filterCourses(published, filters, stats),
    [published, filters, stats],
  );

  const update = (changes: Partial<CatalogFilters>) =>
    setParams(filtersToParams({ ...filters, ...changes }), { replace: true });

  const openStudio = () => {
    if (!requireAuth() || !user) return;
    if (user.role !== 'teacher' && !user.isOwner) updateProfile({ role: 'teacher' });
    navigate('/profile?tab=courses');
  };

  return (
    <Screen
      title="Каталог"
      largeTitle
      withTabBar
      actions={
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Сменить тему"
          className="pressable flex h-10 w-10 items-center justify-center rounded-full"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      }
    >
      <div className="px-4">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-secondary">
          <Sparkles size={12} aria-hidden /> {published.length}{' '}
          {plural(published.length, WORDS.course)}
        </span>
        <p className="font-display mt-3 text-[22px] leading-[1.12]">
          Подготовься к экзаменам <span className="text-secondary">ЕГЭ и ОГЭ</span>
        </p>

        <div className="relative mt-4">
          <Search
            size={17}
            aria-hidden
            className="muted pointer-events-none absolute left-4 top-1/2 -translate-y-1/2"
          />
          <input
            type="search"
            enterKeyHint="search"
            value={filters.query}
            onChange={(event) => update({ query: event.target.value })}
            placeholder="Алгебра, физика, английский…"
            className="inp !rounded-full !py-3 pl-11 pr-10"
            aria-label="Поиск курсов"
          />
          {filters.query && (
            <button
              type="button"
              onClick={() => update({ query: '' })}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2"
              aria-label="Очистить поиск"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <div className="mt-3">
          <Segmented
            label="Экзамен"
            value={filters.exam}
            options={EXAM_SEGMENTS}
            onChange={(exam) => update({ exam: exam as ExamType | 'all' })}
          />
        </div>
      </div>

      <div
        className="no-scrollbar mt-3 flex gap-2 overflow-x-auto px-4 pb-1"
        role="group"
        aria-label="Предмет"
      >
        <Chip active={filters.subject === 'all'} onClick={() => update({ subject: 'all' })}>
          Все предметы
        </Chip>
        {subjects.map((subject) => (
          <Chip
            key={subject}
            active={filters.subject === subject}
            onClick={() => update({ subject })}
          >
            {subject}
          </Chip>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 px-4">
        <span className="muted text-[13px]" aria-live="polite">
          {visible.length} {plural(visible.length, WORDS.course)}
        </span>
        <div className="flex items-center gap-2">
          {activeFilterCount(filters) > 0 && (
            <button
              type="button"
              onClick={() => update({ subject: 'all', exam: 'all' })}
              className="pressable text-[13px] font-medium text-secondary"
            >
              Сбросить
            </button>
          )}
          <PickerField<CatalogSort>
            title="Сортировка"
            aria-label="Сортировка"
            value={filters.sort}
            onChange={(sort) => update({ sort })}
            options={SORT_OPTIONS.map((option) => ({ value: option.id, label: option.label }))}
            className="!w-auto !rounded-full !py-1.5 !pl-3.5 !pr-3 text-[13px]"
          />
        </div>
      </div>

      <section className="mt-3 flex flex-col gap-4 px-4" aria-label="Курсы">
        {visible.length === 0 ? (
          <EmptyState
            icon={Search}
            title="Ничего не нашлось"
            text="Попробуйте другой запрос или снимите фильтры."
            action={
              <Button
                variant="soft"
                size="sm"
                onClick={() => setParams(filtersToParams(DEFAULT_FILTERS))}
              >
                Сбросить всё
              </Button>
            }
          />
        ) : (
          visible.map((course) => (
            <Reveal key={course.id} className="flex">
              <CourseCard course={course} metrics={metrics[course.id]} stats={stats[course.id]} />
            </Reveal>
          ))
        )}
      </section>

      <Reveal
        as="section"
        className="mx-4 mt-6 overflow-hidden rounded-3xl p-5 text-white"
        style={{
          background:
            'linear-gradient(120deg, rgb(var(--color-primary) / 0.96), rgb(var(--color-secondary) / 0.92))',
        }}
      >
        <p className="font-display text-[19px]">Есть чему научить?</p>
        <p className="mt-1.5 text-[13.5px] text-white/85">
          Соберите курс, назначьте цену и получайте доход с каждой продажи.
        </p>
        <button
          type="button"
          onClick={openStudio}
          className="pressable mt-4 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-[14.5px] font-semibold text-[#1a1620]"
        >
          Открыть студию <ArrowRight size={16} aria-hidden />
        </button>
      </Reveal>
      <p className="muted mt-6 px-4 text-[10.5px]">Фото обложек: Unsplash</p>
    </Screen>
  );
}
