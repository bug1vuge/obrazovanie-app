import { BookOpen, Check, Clock, FileText, Lock, Pencil, Play, Users, Video } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { examLabel, getTone } from '@/entities/course/lib';
import { canEditCourse } from '@/entities/course/permissions';
import type { LessonType } from '@/entities/types';
import { useRequireAuth } from '@/features/auth/useRequireAuth';
import { CheckoutSheet } from '@/features/checkout/CheckoutSheet';
import { ReviewSheet } from '@/features/review/ReviewSheet';
import { formatDate, formatDuration, formatPrice, pluralize, WORDS } from '@/shared/lib/format';
import { Avatar, Badge, Button, EmptyState, Reveal, Stars } from '@/shared/ui';
import { Screen, useToast } from '@/shared/ui/native';
import { useAppStore } from '@/store/appStore';
import { errorMessage } from '@/store/errors';
import { useCurrentUser } from '@/store/hooks';
import { getCourseOutline, getLessonProgressIndex, isEnrolled } from '@/store/selectors';
import { values } from '@/store/table';
import { CourseCover } from '@/widgets/course-card/CourseCover';

const LESSON_ICONS: Record<LessonType, typeof FileText> = {
  video: Video,
  text: FileText,
  pdf: FileText,
};

export function CourseScreen() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const requireAuth = useRequireAuth();
  const toast = useToast();
  const db = useAppStore((state) => state.db);
  const enroll = useAppStore((state) => state.enroll);
  const user = useCurrentUser();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);

  const course = db.courses[id];
  const outline = useMemo(() => getCourseOutline(db, id), [db, id]);
  const progress = useMemo(() => getLessonProgressIndex(db, user?.id), [db, user?.id]);
  const reviews = useMemo(
    () =>
      values(db.reviews)
        .filter((review) => review.courseId === id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [db.reviews, id],
  );
  const myReview = user ? (reviews.find((review) => review.userId === user.id) ?? null) : null;
  const students = useMemo(
    () => values(db.enrollments).filter((item) => item.courseId === id).length,
    [db.enrollments, id],
  );

  const enrolled = isEnrolled(db, user?.id, id);
  // Authors (and the administrator) manage the course instead of buying it.
  const isAuthor = canEditCourse(course, user);
  const canSee =
    course && (course.status === 'published' || enrolled || canEditCourse(course, user));

  if (!course || !canSee) {
    return (
      <Screen title="Курс" back="/">
        <div className="px-4 pt-6">
          <EmptyState
            icon={BookOpen}
            title="Курс не найден"
            text="Возможно, он снят с публикации."
            action={<Button onClick={() => navigate('/')}>В каталог</Button>}
          />
        </div>
      </Screen>
    );
  }

  const tone = getTone(course.tone);
  const rating = reviews.length
    ? reviews.reduce((sum, item) => sum + item.rating, 0) / reviews.length
    : 0;
  const previewLesson = outline.lessons.find((lesson) => lesson.isPreview);
  const nextLesson =
    outline.lessons.find((lesson) => !progress[lesson.id]?.completed) ?? outline.lessons[0];
  const { lessonsCount, modulesCount, totalMinutes } = outline.metrics;
  const published = course.status === 'published';

  const enrollFree = () => {
    if (!requireAuth()) return;
    try {
      enroll(course.id);
      toast('Вы записаны на курс. Приятной учёбы!');
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  };

  const footer = isAuthor ? (
    <div className="flex gap-2">
      <Button size="lg" className="flex-1" onClick={() => navigate(`/studio/${id}`)}>
        <Pencil size={17} aria-hidden /> Редактировать
      </Button>
      {outline.lessons[0] && (
        <Button
          size="lg"
          variant="soft"
          onClick={() => navigate(`/learn/${id}/${outline.lessons[0]!.id}`)}
          aria-label="Открыть уроки"
        >
          <Play size={17} aria-hidden />
        </Button>
      )}
    </div>
  ) : enrolled ? (
    <Button
      size="lg"
      className="w-full"
      onClick={() => navigate(nextLesson ? `/learn/${course.id}/${nextLesson.id}` : '/profile')}
    >
      <Play size={18} aria-hidden /> Продолжить обучение
    </Button>
  ) : (
    <div className="flex items-center gap-3">
      <div className="min-w-0">
        <p className="font-display text-[20px] leading-none">{formatPrice(course.price)}</p>
        {course.price > 0 && <p className="muted mt-1 text-[11.5px]">доступ навсегда</p>}
      </div>
      <Button
        size="lg"
        className="ml-auto min-w-[170px]"
        disabled={!published}
        onClick={() => {
          if (course.price > 0) {
            if (requireAuth()) setCheckoutOpen(true);
          } else enrollFree();
        }}
      >
        {course.price > 0 ? 'Купить курс' : 'Записаться'}
      </Button>
    </div>
  );

  return (
    <Screen title={course.title} back="/" hero footer={footer}>
      <div className="relative overflow-hidden">
        <CourseCover course={course} />
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(170deg, ${tone.from}99 0%, ${tone.to}40 40%, rgba(9,7,18,0.92) 100%)`,
          }}
        />
        <div className="relative flex flex-col gap-3 px-4 pb-6 pt-[calc(var(--safe-top)+72px)]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-black/25 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">
              {course.category}
            </span>
            <span className="rounded-full bg-white/20 px-3 py-1 text-[11px] font-medium text-white">
              {examLabel(course.exam)}
            </span>
            {!published && (
              <span className="rounded-full bg-black/35 px-3 py-1 text-[11px] font-medium text-white">
                Черновик
              </span>
            )}
          </div>
          <h2 className="font-display break-words text-[26px] leading-[1.12] text-white">
            {course.title}
          </h2>
          <p className="text-[14px] leading-relaxed text-white/85">
            {course.subtitle || course.description}
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[12.5px] text-white/85">
            <span className="flex items-center gap-1.5">
              <Stars value={rating} size={13} />
              {rating ? rating.toFixed(1) : 'нет оценок'}
            </span>
            <span className="flex items-center gap-1.5">
              <Users size={14} aria-hidden /> {pluralize(students, WORDS.student)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={14} aria-hidden /> {formatDuration(totalMinutes)}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-2.5">
            <Avatar name={course.teacherName} size={34} tone={3} />
            <div className="min-w-0 text-white">
              <div className="text-[13.5px] font-medium">{course.teacherName}</div>
              <div className="truncate text-[11.5px] text-white/75">{course.teacherHeadline}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 px-4 pt-4">
        {!enrolled && !isAuthor && previewLesson && (
          <Button
            variant="outline"
            onClick={() => navigate(`/learn/${course.id}/${previewLesson.id}`)}
          >
            <Play size={16} aria-hidden /> Смотреть пробный урок
          </Button>
        )}

        <Reveal as="section" className="card p-4">
          <h3 className="font-display text-[16px]">О курсе</h3>
          <p className="mt-2 whitespace-pre-line text-[14.5px] leading-relaxed">
            {course.description || 'Описание появится совсем скоро.'}
          </p>
          <ul className="mt-3 flex flex-col gap-2 text-[13.5px]">
            {[
              `${pluralize(lessonsCount, WORDS.lesson)} и ${pluralize(modulesCount, WORDS.module)}`,
              'Тесты с автопроверкой после модулей',
              'Прогресс сохраняется автоматически',
              'PDF-сертификат после завершения',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <Check size={15} className="mt-0.5 shrink-0 text-emerald-500" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </Reveal>

        <section aria-labelledby="program-title">
          <div className="mb-2 flex items-end justify-between px-1">
            <h3 id="program-title" className="font-display text-[17px]">
              Программа
            </h3>
            <span className="muted text-[12.5px]">{pluralize(lessonsCount, WORDS.lesson)}</span>
          </div>
          <div className="flex flex-col gap-3">
            {outline.modules.map((module, index) => (
              <Reveal key={module.id} className="card overflow-hidden">
                <div className="hairline-b flex items-center gap-3 px-4 py-3">
                  <span className="soft-bg flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[12px] font-semibold">
                    {index + 1}
                  </span>
                  <span className="font-display min-w-0 text-[14px]">{module.title}</span>
                </div>
                <ul className="divide-y divide-[rgb(var(--line)/0.08)]">
                  {(outline.lessonsByModule[module.id] ?? []).map((lesson) => {
                    const Icon = LESSON_ICONS[lesson.type];
                    const open = enrolled || lesson.isPreview;
                    const row = (
                      <>
                        <Icon size={16} className="muted shrink-0" aria-hidden />
                        <span className="min-w-0 flex-1 text-[14px] leading-snug">
                          {lesson.title}
                        </span>
                        {lesson.isPreview && !enrolled && <Badge tone="ok">Пробный</Badge>}
                        {!open && (
                          <Lock
                            size={14}
                            className="muted shrink-0"
                            aria-label="Доступен после записи"
                          />
                        )}
                        <span className="muted shrink-0 text-[12px]">
                          {formatDuration(lesson.duration)}
                        </span>
                      </>
                    );
                    return (
                      <li key={lesson.id}>
                        {open ? (
                          <Link
                            to={`/learn/${course.id}/${lesson.id}`}
                            className="pressable flex items-center gap-3 px-4 py-3"
                          >
                            {row}
                          </Link>
                        ) : (
                          <div className="flex items-center gap-3 px-4 py-3">{row}</div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </Reveal>
            ))}
            {outline.modules.length === 0 && (
              <EmptyState title="Программа пока пуста" text="Преподаватель ещё наполняет курс." />
            )}
          </div>
        </section>

        <section aria-labelledby="reviews-title">
          <div className="mb-2 flex items-end justify-between px-1">
            <h3 id="reviews-title" className="font-display text-[17px]">
              Отзывы · {reviews.length}
            </h3>
            {enrolled && (
              <button
                type="button"
                onClick={() => setReviewOpen(true)}
                className="pressable text-[14px] font-medium text-secondary"
              >
                {myReview ? 'Изменить отзыв' : 'Оставить отзыв'}
              </button>
            )}
          </div>
          {reviews.length === 0 ? (
            <EmptyState title="Отзывов пока нет" text="Станьте первым, кто оценит курс." />
          ) : (
            <div
              tabIndex={0}
              aria-label="Отзывы учеников"
              className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1"
            >
              {reviews.map((review) => (
                <article key={review.id} className="card w-[82%] shrink-0 snap-start p-4">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={review.userName} size={30} tone={1} />
                    <span className="min-w-0 truncate text-[13.5px] font-medium">
                      {review.userName}
                    </span>
                    <span className="ml-auto shrink-0">
                      <Stars value={review.rating} size={12} />
                    </span>
                  </div>
                  <p className="mt-2 text-[13.5px] leading-relaxed">{review.text}</p>
                  <p className="muted mt-2 text-[11.5px]">{formatDate(review.createdAt)}</p>
                </article>
              ))}
            </div>
          )}
        </section>

        <Reveal as="section" className="card flex items-start gap-3 p-4">
          <Avatar name={course.teacherName} size={48} tone={3} />
          <div className="min-w-0">
            <p className="font-display text-[15px]">{course.teacherName}</p>
            <p className="muted text-[12.5px]">
              {course.teacherHeadline || 'Преподаватель Study Pro'}
            </p>
            {course.teacherBio && course.teacherBio !== course.teacherHeadline && (
              <p className="mt-2 text-[13.5px] leading-relaxed">{course.teacherBio}</p>
            )}
          </div>
        </Reveal>
        <p className="muted px-1 text-[11.5px] leading-relaxed">
          Доступ открывается сразу после оплаты. 30 дней на возврат, если курс не подошёл. Фото
          обложки: {course.coverCredit || 'Unsplash'}.
        </p>
      </div>

      <CheckoutSheet
        course={course}
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        onPaid={() => {
          setCheckoutOpen(false);
          toast('Оплата прошла — курс открыт!');
        }}
      />
      <ReviewSheet
        courseId={course.id}
        existing={myReview}
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
      />
    </Screen>
  );
}
