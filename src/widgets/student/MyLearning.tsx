import { Award, BookOpen, Clock, Play, Trophy, TrendingUp } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getTone } from '@/entities/course/lib';
import type { User } from '@/entities/types';
import { formatDuration } from '@/shared/lib/format';
import { Button, Chip, EmptyState, ProgressBar, Reveal, StatCard } from '@/shared/ui';
import { useAppStore } from '@/store/appStore';
import { useCourseMetrics } from '@/store/hooks';
import { getUserLearning } from '@/store/selectors';

export function MyLearning({ user }: { user: User }) {
  const db = useAppStore((state) => state.db);
  const metrics = useCourseMetrics();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'active' | 'finished'>('active');

  const items = useMemo(() => getUserLearning(db, user.id), [db, user.id]);
  const active = items.filter((item) => item.percent < 100);
  const finished = items.filter((item) => item.total > 0 && item.percent >= 100);
  const list = tab === 'active' ? active : finished;
  const minutesSpent = items.reduce(
    (sum, item) =>
      sum + (metrics[item.enrollment.courseId]?.totalMinutes ?? 0) * (item.percent / 100),
    0,
  );

  return (
    <section aria-labelledby="learning-title">
      <h2 id="learning-title" className="font-display text-lg">
        Моё обучение
      </h2>
      <p className="muted mt-1 text-[13.5px]">Продолжайте с того места, где остановились.</p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <StatCard icon={BookOpen} label="Курсов" value={items.length} />
        <StatCard icon={Trophy} label="Завершено" value={finished.length} />
        <StatCard
          icon={TrendingUp}
          label="Уроков пройдено"
          value={items.reduce((sum, item) => sum + item.completed, 0)}
        />
        <StatCard
          icon={Award}
          label="Тестов сдано"
          value={items.reduce((sum, item) => sum + item.quizzesPassed, 0)}
        />
      </div>

      <div className="mt-5 flex gap-2">
        <Chip active={tab === 'active'} onClick={() => setTab('active')}>
          В процессе · {active.length}
        </Chip>
        <Chip active={tab === 'finished'} onClick={() => setTab('finished')}>
          Завершённые · {finished.length}
        </Chip>
      </div>

      <div className="mt-4">
        {list.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title={tab === 'active' ? 'Пока нет активных курсов' : 'Ещё нет завершённых курсов'}
            text={
              tab === 'active'
                ? 'Выберите курс в каталоге — и он появится здесь.'
                : 'Дойдите до конца курса, чтобы получить сертификат.'
            }
            action={<Button onClick={() => navigate('/')}>Открыть каталог</Button>}
          />
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {list.map((item) => {
              const tone = getTone(item.course?.tone);
              const courseId = item.enrollment.courseId;
              return (
                <Reveal key={item.enrollment.id} className="card overflow-hidden">
                  <div className="flex items-stretch">
                    <div
                      className="w-2 shrink-0"
                      style={{ background: `linear-gradient(${tone.from}, ${tone.to})` }}
                    />
                    <div className="min-w-0 flex-1 p-4">
                      <Link
                        to={`/course/${courseId}`}
                        className="font-display line-clamp-2 text-[15px] leading-snug hover:underline"
                      >
                        {item.course?.title ?? item.enrollment.courseTitle}
                      </Link>
                      <p className="muted mt-1 text-[12px]">
                        {item.course?.teacherName ?? 'Study Pro'}
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        <ProgressBar value={item.percent} thin />
                        <span className="shrink-0 text-[11.5px] font-semibold">
                          {item.percent}%
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                        <span className="muted flex items-center gap-1 text-[11.5px]">
                          <Clock size={12} aria-hidden /> {item.completed}/{item.total} уроков
                        </span>
                        {item.percent >= 100 ? (
                          <Button
                            size="sm"
                            variant="accent"
                            onClick={() => navigate(`/certificate/${courseId}`)}
                          >
                            <Award size={14} aria-hidden /> Сертификат
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() =>
                              navigate(
                                item.nextLessonId
                                  ? `/learn/${courseId}/${item.nextLessonId}`
                                  : `/learn/${courseId}`,
                              )
                            }
                          >
                            <Play size={14} aria-hidden /> Продолжить
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        )}
      </div>
      {minutesSpent > 0 && (
        <p className="muted mt-5 text-[12px]">
          Потрачено на обучение: {formatDuration(minutesSpent)}
        </p>
      )}
    </section>
  );
}
