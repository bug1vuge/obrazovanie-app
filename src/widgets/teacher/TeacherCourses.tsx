import { BookOpen, Pencil, Plus } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { examLabel, isVisibleCourse, STATUS_LABELS, STATUS_TONES } from '@/entities/course/lib';
import type { User } from '@/entities/types';
import { formatPrice, pluralize, WORDS } from '@/shared/lib/format';
import { Badge, Button, EmptyState, Field, Notice } from '@/shared/ui';
import { Sheet } from '@/shared/ui/native';
import { useAppStore } from '@/store/appStore';
import { errorMessage } from '@/store/errors';
import { useCourseMetrics, useCourseStats } from '@/store/hooks';
import { values } from '@/store/table';
import { CourseCover } from '@/widgets/course-card/CourseCover';

export function TeacherCourses({ user }: { user: User }) {
  const courses = useAppStore((state) => state.db.courses);
  const createCourse = useAppStore((state) => state.createCourse);
  const metrics = useCourseMetrics();
  const stats = useCourseStats();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');

  const own = useMemo(
    () =>
      values(courses)
        .filter((course) => course.teacherId === user.id)
        .filter(isVisibleCourse)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [courses, user.id],
  );

  const submit = (event: FormEvent) => {
    event.preventDefault();
    try {
      const course = createCourse(title);
      setOpen(false);
      setTitle('');
      navigate(`/studio/${course.id}`);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <section aria-labelledby="courses-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="courses-title" className="font-display text-lg">
            Мои курсы
          </h2>
          <p className="muted mt-1 text-[13.5px]">
            Создавайте курсы, отправляйте на модерацию и следите за учениками.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus size={16} aria-hidden /> Создать курс
        </Button>
      </div>

      <div className="mt-4">
        {own.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="Ещё нет курсов"
            text="Создайте первый курс: модули → уроки → тест, затем отправьте на модерацию."
            action={<Button onClick={() => setOpen(true)}>Создать курс</Button>}
          />
        ) : (
          <ul className="flex flex-col gap-2.5">
            {own.map((course) => (
              <li key={course.id} className="card flex flex-col gap-3 p-4">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl">
                  <CourseCover course={course} sizes="96px" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-display truncate text-[15px]">{course.title}</p>
                    <Badge tone={STATUS_TONES[course.status]}>{STATUS_LABELS[course.status]}</Badge>
                  </div>
                  <p className="muted mt-0.5 text-[12px]">
                    {course.category} · {examLabel(course.exam)} ·{' '}
                    {pluralize(metrics[course.id]?.lessonsCount ?? 0, WORDS.lesson)} ·{' '}
                    {formatPrice(course.price)} ·{' '}
                    {pluralize(stats[course.id]?.students ?? 0, WORDS.student)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link to={`/course/${course.id}`} className="chip hover-line">
                    Открыть
                  </Link>
                  <Button size="sm" variant="soft" onClick={() => navigate(`/studio/${course.id}`)}>
                    <Pencil size={14} aria-hidden /> Редактировать
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="Новый курс"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Отмена
            </Button>
            <Button type="submit" form="new-course-form">
              Создать и открыть
            </Button>
          </div>
        }
      >
        <form id="new-course-form" onSubmit={submit}>
          <Field label="Название курса">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="inp"
              placeholder="Например: Геометрия для ОГЭ"
              autoFocus
            />
          </Field>
          {error && (
            <Notice tone="error" className="mt-3">
              {error}
            </Notice>
          )}
          <p className="muted mt-3 text-[12.5px] leading-relaxed">
            Курс создаётся как черновик. Наполните его уроками и отправьте на модерацию — после
            одобрения он появится в каталоге.
          </p>
        </form>
      </Sheet>
    </section>
  );
}
