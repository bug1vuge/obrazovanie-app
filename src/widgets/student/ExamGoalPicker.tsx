import { ArrowRight, Check, Pencil, Play, Target } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EXAMS, matchesExam } from '@/entities/course/lib';
import type { Course, ExamType, User } from '@/entities/types';
import { cn } from '@/shared/lib/cn';
import { formatPrice } from '@/shared/lib/format';
import { Button, Chip, Segmented } from '@/shared/ui';
import { useAppStore } from '@/store/appStore';
import { getSubjectNames, isEnrolled } from '@/store/selectors';
import { values } from '@/store/table';
import { CourseCover } from '@/widgets/course-card/CourseCover';

function CourseOption({
  course,
  selected,
  onSelect,
}: {
  course: Course;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        'flex w-full items-center gap-3 rounded-2xl border p-2.5 text-left transition',
        selected ? 'border-[rgb(var(--color-primary)/0.6)] bg-primary/10' : 'bd hover-line',
      )}
    >
      <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl">
        <CourseCover course={course} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13.5px] font-semibold">{course.title}</span>
        <span className="muted block truncate text-[12px]">
          {course.teacherName} · {formatPrice(course.price)}
        </span>
      </span>
      <span
        aria-hidden
        className={cn(
          'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
          selected ? 'on-primary border-transparent bg-primary' : 'bd',
        )}
      >
        {selected && <Check size={12} />}
      </span>
    </button>
  );
}

/**
 * First thing a student sees in the cabinet: choose the exam (ОГЭ/ЕГЭ) and the
 * course to prepare with. The choice is stored in the profile.
 */
export function ExamGoalPicker({ user }: { user: User }) {
  const db = useAppStore((state) => state.db);
  const setGoal = useAppStore((state) => state.setGoal);
  const navigate = useNavigate();
  const [editing, setEditing] = useState(!user.goal?.courseId);
  const [exam, setExam] = useState<ExamType | null>(user.goal?.exam ?? null);
  const [subject, setSubject] = useState<string>('all');

  const courses = useMemo(
    () =>
      exam
        ? values(db.courses)
            .filter((course) => course.status === 'published' && matchesExam(course, exam))
            .filter((course) => subject === 'all' || course.category === subject)
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        : [],
    [db.courses, exam, subject],
  );
  const subjects = useMemo(() => getSubjectNames(db), [db]);

  const goalCourse = user.goal?.courseId ? db.courses[user.goal.courseId] : undefined;

  if (!editing && user.goal && goalCourse) {
    const enrolled = isEnrolled(db, user.id, goalCourse.id);
    return (
      <section className="card overflow-hidden" aria-label="Цель подготовки">
        <div className="flex flex-col gap-4 p-5">
          <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl">
            <CourseCover course={goalCourse} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="muted flex items-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-wider">
              <Target size={13} aria-hidden /> Готовлюсь к{' '}
              {user.goal.exam === 'ege' ? 'ЕГЭ' : 'ОГЭ'}
            </p>
            <p className="font-display mt-1 text-[16px] leading-snug">{goalCourse.title}</p>
            <p className="muted mt-0.5 text-[12.5px]">{goalCourse.teacherName}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() =>
                navigate(enrolled ? `/learn/${goalCourse.id}` : `/course/${goalCourse.id}`)
              }
            >
              {enrolled ? (
                <>
                  <Play size={15} aria-hidden /> Продолжить
                </>
              ) : (
                <>
                  Перейти к курсу <ArrowRight size={15} aria-hidden />
                </>
              )}
            </Button>
            <Button variant="soft" onClick={() => setEditing(true)}>
              <Pencil size={14} aria-hidden /> Изменить
            </Button>
          </div>
        </div>
      </section>
    );
  }

  const choose = (courseId: string) => {
    if (!exam) return;
    setGoal({ exam, courseId });
    setEditing(false);
  };

  return (
    <section className="card p-5" aria-labelledby="goal-title">
      <h2 id="goal-title" className="font-display text-[17px]">
        К какому экзамену готовитесь?
      </h2>
      <p className="muted mt-1 text-[13px]">
        Выберите экзамен и курс — мы соберём подготовку вокруг вашей цели.
      </p>

      <div className="mt-4">
        <Segmented
          label="Экзамен"
          size="lg"
          value={exam}
          options={EXAMS}
          onChange={(value) => {
            setExam(value);
            setSubject('all');
          }}
        />
      </div>

      {exam && (
        <div className="mt-5">
          <p className="muted mb-2 text-[12.5px] font-medium uppercase tracking-wide">Курс</p>
          <div
            className="no-scrollbar flex gap-2 overflow-x-auto pb-1"
            role="group"
            aria-label="Предмет"
          >
            <Chip active={subject === 'all'} onClick={() => setSubject('all')}>
              Все предметы
            </Chip>
            {subjects.map((name) => (
              <Chip key={name} active={subject === name} onClick={() => setSubject(name)}>
                {name}
              </Chip>
            ))}
          </div>
          <div role="radiogroup" aria-label="Курс" className="mt-3 grid grid-cols-1 gap-2">
            {courses.map((course) => (
              <CourseOption
                key={course.id}
                course={course}
                selected={user.goal?.courseId === course.id}
                onSelect={() => choose(course.id)}
              />
            ))}
            {courses.length === 0 && (
              <p className="muted text-[13px]">
                По этому предмету пока нет курсов для выбранного экзамена.
              </p>
            )}
          </div>
        </div>
      )}

      {user.goal?.courseId && (
        <div className="mt-4 flex justify-end">
          <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
            Отмена
          </Button>
        </div>
      )}
    </section>
  );
}
