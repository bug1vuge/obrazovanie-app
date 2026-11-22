import {
  Award,
  Check,
  ChevronLeft,
  ChevronRight,
  Circle,
  CircleCheck,
  FileText,
  ListOrdered,
  Video,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getTone } from '@/entities/course/lib';
import { canEditCourse } from '@/entities/course/permissions';
import type { Lesson } from '@/entities/types';
import { useRequireAuth } from '@/features/auth/useRequireAuth';
import { cn } from '@/shared/lib/cn';
import { formatDuration } from '@/shared/lib/format';
import { isEmbeddableVideo, toEmbedUrl } from '@/shared/lib/video';
import { Badge, Button, EmptyState, ProgressBar } from '@/shared/ui';
import { Screen, Sheet } from '@/shared/ui/native';
import { useAppStore } from '@/store/appStore';
import { useCurrentUser } from '@/store/hooks';
import {
  getCourseOutline,
  getLessonProgressIndex,
  getQuizResultIndex,
  isEnrolled,
} from '@/store/selectors';

function LessonMedia({ lesson }: { lesson: Lesson }) {
  const [broken, setBroken] = useState(false);
  if (lesson.type === 'video' && lesson.videoUrl) {
    return (
      <div className="-mx-4 mt-4 overflow-hidden bg-black">
        {broken ? (
          <div className="flex aspect-video flex-col items-center justify-center gap-2 p-6 text-center text-white/80">
            <Video size={26} aria-hidden />
            <p className="text-[13.5px]">Видео недоступно по этой ссылке.</p>
          </div>
        ) : isEmbeddableVideo(lesson.videoUrl) ? (
          <iframe
            src={toEmbedUrl(lesson.videoUrl)}
            title={lesson.title}
            className="aspect-video w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <video
            src={lesson.videoUrl}
            controls
            playsInline
            className="aspect-video w-full"
            onError={() => setBroken(true)}
          />
        )}
      </div>
    );
  }
  if (lesson.type === 'pdf' && lesson.pdfUrl) {
    return (
      <a
        href={lesson.pdfUrl}
        target="_blank"
        rel="noreferrer"
        className="card pressable mt-4 flex items-center gap-3 p-4 text-[14px]"
      >
        <FileText size={20} aria-hidden /> Открыть PDF-материал
      </a>
    );
  }
  return null;
}

export function LessonScreen() {
  const { courseId = '', lessonId } = useParams();
  const navigate = useNavigate();
  const requireAuth = useRequireAuth();
  const db = useAppStore((state) => state.db);
  const setLessonCompleted = useAppStore((state) => state.setLessonCompleted);
  const user = useCurrentUser();
  const [contentsOpen, setContentsOpen] = useState(false);

  const course = db.courses[courseId];
  const outline = useMemo(() => getCourseOutline(db, courseId), [db, courseId]);
  const progress = useMemo(() => getLessonProgressIndex(db, user?.id), [db, user?.id]);
  const quizResults = useMemo(() => getQuizResultIndex(db, user?.id), [db, user?.id]);

  if (!course) {
    return (
      <Screen title="Урок" back="/">
        <div className="px-4 pt-6">
          <EmptyState
            title="Курс не найден"
            action={<Button onClick={() => navigate('/')}>В каталог</Button>}
          />
        </div>
      </Screen>
    );
  }

  const lesson = outline.lessons.find((item) => item.id === lessonId) ?? outline.lessons[0] ?? null;
  const index = lesson ? outline.lessons.findIndex((item) => item.id === lesson.id) : -1;
  const hasFullAccess = isEnrolled(db, user?.id, courseId) || canEditCourse(course, user);
  const canOpen = hasFullAccess || Boolean(lesson?.isPreview);
  const completed = outline.lessons.filter((item) => progress[item.id]?.completed).length;
  const percent = outline.lessons.length ? (completed / outline.lessons.length) * 100 : 0;
  const finished = outline.lessons.length > 0 && completed >= outline.lessons.length;
  const isDone = lesson ? Boolean(progress[lesson.id]?.completed) : false;
  const module = outline.modules.find((item) => item.id === lesson?.moduleId);
  const tone = getTone(course.tone);
  const back = `/course/${courseId}`;

  const go = (step: -1 | 1) => {
    const target = outline.lessons[index + step];
    if (target) navigate(`/learn/${courseId}/${target.id}`, { replace: true });
  };

  const toggleDone = () => {
    if (!lesson || !requireAuth()) return;
    setLessonCompleted(lesson.id, !isDone);
  };

  const contents = (
    <nav aria-label="Содержание курса" className="-mx-5">
      <div className="px-5 pb-3">
        <ProgressBar value={percent} thin />
        <p className="muted mt-1.5 text-[12px]">
          {completed} из {outline.lessons.length} уроков · {Math.round(percent)}%
        </p>
      </div>
      {outline.modules.map((item, moduleIndex) => {
        const quiz = outline.quizByModule[item.id];
        const result = quiz ? quizResults[quiz.id] : undefined;
        return (
          <div key={item.id} className="hairline-t py-2">
            <p className="muted px-5 py-1.5 text-[11px] font-semibold uppercase tracking-wider">
              Модуль {moduleIndex + 1} · {item.title.replace(/^Модуль \d+\.\s*/, '')}
            </p>
            <ul>
              {(outline.lessonsByModule[item.id] ?? []).map((entry) => {
                const current = entry.id === lesson?.id;
                return (
                  <li key={entry.id}>
                    <Link
                      to={`/learn/${courseId}/${entry.id}`}
                      replace
                      onClick={() => setContentsOpen(false)}
                      aria-current={current ? 'page' : undefined}
                      className={cn(
                        'pressable flex items-start gap-3 px-5 py-2.5 text-[14px]',
                        current && 'bg-primary/10',
                      )}
                    >
                      {progress[entry.id]?.completed ? (
                        <CircleCheck
                          size={18}
                          className="mt-0.5 shrink-0 text-emerald-500"
                          aria-label="Пройден"
                        />
                      ) : (
                        <Circle size={18} className="muted mt-0.5 shrink-0" aria-hidden />
                      )}
                      <span
                        className={cn('min-w-0 flex-1 leading-snug', current && 'font-semibold')}
                      >
                        {entry.title}
                      </span>
                      <span className="muted shrink-0 text-[11.5px]">
                        {formatDuration(entry.duration)}
                      </span>
                    </Link>
                  </li>
                );
              })}
              {quiz && (
                <li>
                  <button
                    type="button"
                    disabled={!hasFullAccess}
                    onClick={() => {
                      setContentsOpen(false);
                      navigate(`/learn/${courseId}/quiz/${quiz.id}`);
                    }}
                    className="pressable flex w-full items-center gap-3 px-5 py-2.5 text-left text-[14px] disabled:opacity-50"
                  >
                    <Award size={18} className="muted shrink-0" aria-hidden />
                    <span className="min-w-0 flex-1">Тест модуля</span>
                    {result?.passed && <Badge tone="ok">{result.score}%</Badge>}
                  </button>
                </li>
              )}
            </ul>
          </div>
        );
      })}
    </nav>
  );

  return (
    <Screen
      title={course.title}
      back={back}
      actions={
        <button
          type="button"
          onClick={() => setContentsOpen(true)}
          aria-label="Содержание"
          className="pressable flex h-10 w-10 items-center justify-center rounded-full"
        >
          <ListOrdered size={21} />
        </button>
      }
      footer={
        canOpen && lesson ? (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="!px-3.5"
              onClick={() => go(-1)}
              disabled={index <= 0}
              aria-label="Предыдущий урок"
            >
              <ChevronLeft size={18} />
            </Button>
            <Button
              variant={isDone ? 'soft' : 'primary'}
              className="flex-1"
              onClick={toggleDone}
              aria-pressed={isDone}
            >
              <Check size={17} aria-hidden /> {isDone ? 'Пройдено' : 'Отметить пройденным'}
            </Button>
            <Button
              variant="outline"
              className="!px-3.5"
              onClick={() => go(1)}
              disabled={index >= outline.lessons.length - 1}
              aria-label="Следующий урок"
            >
              <ChevronRight size={18} />
            </Button>
          </div>
        ) : undefined
      }
    >
      <div className="px-4">
        <ProgressBar value={percent} thin className="mb-4" />
        {!canOpen ? (
          <div className="card p-5">
            <h2 className="font-display text-[18px]">Урок доступен после записи</h2>
            <p className="muted mt-1.5 text-[14px]">
              Запишитесь на курс, чтобы открыть все уроки, тесты и сертификат.
            </p>
            <Button className="mt-4" onClick={() => navigate(back)}>
              К странице курса
            </Button>
          </div>
        ) : lesson ? (
          <article>
            <p className="muted text-[11.5px] font-semibold uppercase tracking-wider">
              {module?.title ?? 'Урок'} · {index + 1}/{outline.lessons.length}
            </p>
            <h2 className="font-display mt-1 text-[23px] leading-tight">{lesson.title}</h2>
            <LessonMedia key={lesson.id} lesson={lesson} />
            {lesson.content && (
              <div className="mt-4 whitespace-pre-line text-[16px] leading-[1.7]">
                {lesson.content}
              </div>
            )}
            {!hasFullAccess && (
              <p className="soft-bg mt-5 rounded-2xl px-4 py-3 text-[13.5px]">
                Это пробный урок. Запишитесь на курс, чтобы открыть остальные уроки и тесты.
              </p>
            )}
            {finished && (
              <div
                className="mt-6 rounded-3xl p-5"
                style={{ background: `linear-gradient(130deg, ${tone.from}, ${tone.to})` }}
              >
                <p className="font-display text-[18px] text-white">Курс пройден полностью</p>
                <p className="mt-1 text-[13.5px] text-white/85">
                  Заберите именной сертификат в PDF.
                </p>
                <Link
                  to={`/certificate/${courseId}`}
                  className="pressable mt-3 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[14.5px] font-medium text-[#1a1620]"
                >
                  <Award size={16} aria-hidden /> Открыть сертификат
                </Link>
              </div>
            )}
          </article>
        ) : (
          <EmptyState
            title="В курсе пока нет уроков"
            text="Преподаватель скоро добавит материалы."
          />
        )}
      </div>

      <Sheet open={contentsOpen} onClose={() => setContentsOpen(false)} title="Содержание" tall>
        {contents}
      </Sheet>
    </Screen>
  );
}
