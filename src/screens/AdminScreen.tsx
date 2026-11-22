import { Check, Coins, Eye, ShieldCheck, Tag, Trash2, Users, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  examLabel,
  isVisibleCourse,
  sortByOrder,
  STATUS_LABELS,
  STATUS_TONES,
} from '@/entities/course/lib';
import type { Course, CourseStatus } from '@/entities/types';
import { useNavigate } from 'react-router-dom';
import { formatMoney, formatPrice } from '@/shared/lib/format';
import { Badge, Button, EmptyState, StatCard } from '@/shared/ui';
import { ConfirmSheet, Screen, useToast } from '@/shared/ui/native';
import { DonutChart } from '@/shared/ui/charts';
import { useAppStore } from '@/store/appStore';
import { errorMessage } from '@/store/errors';
import { useCourseMetrics, useCurrentUser } from '@/store/hooks';
import { getPlatformStats } from '@/store/selectors';
import { values } from '@/store/table';
import { CourseCover } from '@/widgets/course-card/CourseCover';

export function AdminScreen() {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const db = useAppStore((state) => state.db);
  const setCourseStatus = useAppStore((state) => state.setCourseStatus);
  const deleteCourse = useAppStore((state) => state.deleteCourse);
  const addCategory = useAppStore((state) => state.addCategory);
  const deleteCategory = useAppStore((state) => state.deleteCategory);
  const metrics = useCourseMetrics();
  const toast = useToast();
  const [newCategory, setNewCategory] = useState('');
  const [toDelete, setToDelete] = useState<Course | null>(null);

  const stats = useMemo(() => getPlatformStats(db), [db]);
  const courses = useMemo(
    () =>
      values(db.courses)
        .filter(isVisibleCourse)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [db.courses],
  );
  const pending = courses.filter((course) => course.status === 'pending');
  const categories = useMemo(() => sortByOrder(values(db.categories)), [db.categories]);

  const run = (action: () => void, success: string) => {
    try {
      action();
      toast(success);
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  };

  const changeStatus = (course: Course, status: CourseStatus) =>
    run(
      () => setCourseStatus(course.id, status),
      status === 'published'
        ? `Курс «${course.title}» опубликован`
        : status === 'rejected'
          ? `Курс «${course.title}» отклонён`
          : `Курс «${course.title}» снят с публикации`,
    );

  if (!user?.isOwner) {
    return (
      <Screen title="Админ-панель" back="/profile">
        <div className="px-4 pt-6">
          <EmptyState
            icon={ShieldCheck}
            title="Админ-панель"
            text="Доступ есть только у администратора платформы."
            action={
              user ? (
                <p className="muted text-[12.5px]">
                  Вы вошли как {user.email}. Войдите аккаунтом администратора.
                </p>
              ) : (
                <Button onClick={() => navigate('/login?from=/admin')}>Войти</Button>
              )
            }
          />
        </div>
      </Screen>
    );
  }

  return (
    <Screen title="Админ-панель" largeTitle back="/profile">
      <div className="px-4">
        <p className="muted text-[14px]">Модерация курсов, предметы и статистика платформы.</p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <StatCard icon={Users} label="Пользователей" value={stats.users} />
          <StatCard icon={Eye} label="Курсов" value={stats.courses} />
          <StatCard icon={Check} label="Записей на курсы" value={stats.enrollments} />
          <StatCard icon={Coins} label="Оборот" value={formatMoney(stats.turnover)} />
        </div>

        <section className="mt-7" aria-labelledby="moderation-title">
          <div className="mb-3 flex items-center gap-2">
            <h2 id="moderation-title" className="font-display text-lg">
              На модерации
            </h2>
            {pending.length > 0 && <Badge tone="warn">{pending.length}</Badge>}
          </div>
          {pending.length === 0 ? (
            <EmptyState
              title="Очередь пуста"
              text="Новые курсы появятся здесь после отправки преподавателем."
            />
          ) : (
            <ul className="flex flex-col gap-2.5">
              {pending.map((course) => (
                <li key={course.id} className="card flex flex-col gap-3 p-4">
                  <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl">
                    <CourseCover course={course} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-display truncate text-[15px]">{course.title}</p>
                    <p className="muted mt-0.5 text-[12px]">
                      {course.teacherName} · {course.category} · {examLabel(course.exam)} ·{' '}
                      {metrics[course.id]?.lessonsCount ?? 0} уроков · {formatPrice(course.price)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => changeStatus(course, 'published')}>
                      <Check size={14} aria-hidden /> Опубликовать
                    </Button>
                    <Button
                      size="sm"
                      variant="soft"
                      onClick={() => changeStatus(course, 'rejected')}
                    >
                      <X size={14} aria-hidden /> Отклонить
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {stats.bySubject.length > 0 && (
          <section className="card mt-5 p-4" aria-labelledby="subjects-chart-title">
            <h2 id="subjects-chart-title" className="font-display mb-3 text-[14.5px]">
              Курсы по предметам
            </h2>
            <DonutChart
              title="Курсы по предметам"
              data={stats.bySubject.map((item) => ({ label: item.key, value: item.count }))}
            />
          </section>
        )}

        <section className="mt-7" aria-labelledby="all-courses-title">
          <h2 id="all-courses-title" className="font-display mb-3 text-lg">
            Все курсы
          </h2>
          <div className="card overflow-hidden">
            <div className="hairline-b muted hidden grid-cols-[1fr_160px_130px_150px] gap-2 px-4 py-2 text-[11.5px] font-semibold uppercase tracking-wide">
              <span>Курс</span>
              <span>Автор</span>
              <span>Статус</span>
              <span className="text-right">Действия</span>
            </div>
            <ul className="divide-y divide-[rgb(var(--line)/0.08)]">
              {courses.map((course) => (
                <li key={course.id} className="grid grid-cols-1 gap-x-2 gap-y-2 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-medium">{course.title}</p>
                    <p className="muted text-[11.5px]">
                      {course.category} · {metrics[course.id]?.lessonsCount ?? 0} ур. ·{' '}
                      {formatPrice(course.price)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    <span className="muted truncate text-[12.5px]">
                      {course.teacherName || '—'}
                    </span>
                    <span>
                      <Badge tone={STATUS_TONES[course.status]}>
                        {STATUS_LABELS[course.status]}
                      </Badge>
                    </span>
                    <div className="ml-auto flex items-center gap-1.5">
                      {course.status !== 'published' ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => changeStatus(course, 'published')}
                          aria-label={`Опубликовать «${course.title}»`}
                        >
                          <Check size={15} className="text-emerald-500" />
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => changeStatus(course, 'draft')}
                          aria-label={`Снять с публикации «${course.title}»`}
                        >
                          <X size={15} />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setToDelete(course)}
                        aria-label={`Удалить «${course.title}»`}
                      >
                        <Trash2 size={15} className="text-red-500" />
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            {courses.length === 0 && (
              <p className="muted px-4 py-6 text-center text-[13px]">Курсов пока нет</p>
            )}
          </div>
        </section>

        <section className="mt-7" aria-labelledby="subjects-title">
          <h2 id="subjects-title" className="font-display mb-3 flex items-center gap-2 text-lg">
            <Tag size={16} aria-hidden /> Предметы
          </h2>
          <div className="card p-4">
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <span key={category.id} className="chip max-w-full !whitespace-normal">
                  {category.name}
                  <button
                    type="button"
                    onClick={() =>
                      run(() => deleteCategory(category.id), `Предмет «${category.name}» удалён`)
                    }
                    className="ml-1 text-red-500"
                    aria-label={`Удалить предмет «${category.name}»`}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
              {categories.length === 0 && (
                <p className="muted text-[13px]">
                  Предметы ещё не добавлены — используются взятые из курсов.
                </p>
              )}
            </div>
            <form
              className="mt-3 flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                run(() => {
                  addCategory(newCategory);
                  setNewCategory('');
                }, `Предмет «${newCategory.trim()}» добавлен`);
              }}
            >
              <input
                value={newCategory}
                onChange={(event) => setNewCategory(event.target.value)}
                className="inp !py-2 text-[13px]"
                placeholder="Новый предмет"
                aria-label="Новый предмет"
              />
              <Button size="sm" type="submit">
                Добавить
              </Button>
            </form>
          </div>
        </section>

        <ConfirmSheet
          open={Boolean(toDelete)}
          title="Удалить курс?"
          message={`Курс «${toDelete?.title ?? ''}» будет удалён вместе с уроками и тестами. Это действие необратимо.`}
          confirmLabel="Удалить"
          destructive
          onClose={() => setToDelete(null)}
          onConfirm={() => {
            const course = toDelete;
            if (course) run(() => deleteCourse(course.id), 'Курс удалён');
          }}
        />
      </div>
    </Screen>
  );
}
