import {
  Award,
  ChevronDown,
  ChevronUp,
  Eye,
  Plus,
  Save,
  Send,
  Trash2,
  WandSparkles,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  COURSE_EXAM_OPTIONS,
  LESSON_TYPES,
  STATUS_LABELS,
  STATUS_TONES,
  TONES,
  sortByOrder,
} from '@/entities/course/lib';
import { canEditCourse } from '@/entities/course/permissions';
import { optionLetter } from '@/entities/quiz/lib';
import type { Course, CourseExam, Lesson, LessonType, QuizQuestion } from '@/entities/types';
import { cn } from '@/shared/lib/cn';
import { createId } from '@/shared/lib/id';
import { formatDuration, pluralize, WORDS } from '@/shared/lib/format';
import { Badge, Button, EmptyState, Field } from '@/shared/ui';
import { ConfirmSheet, PickerField, Screen, Sheet, useToast } from '@/shared/ui/native';
import { useAppStore } from '@/store/appStore';
import { errorMessage } from '@/store/errors';
import { useCurrentUser } from '@/store/hooks';
import { getCourseOutline } from '@/store/selectors';
import type { LessonInput, QuizInput } from '@/store/slices/studioSlice';
import { values } from '@/store/table';

type LessonDraft = LessonInput;

const emptyLesson = (moduleId: string): LessonDraft => ({
  moduleId,
  title: '',
  type: 'text',
  duration: 10,
  content: '',
  videoUrl: '',
  pdfUrl: '',
  isPreview: false,
});

const toDraft = (lesson: Lesson): LessonDraft => ({
  id: lesson.id,
  moduleId: lesson.moduleId,
  title: lesson.title,
  type: lesson.type,
  duration: lesson.duration,
  content: lesson.content,
  videoUrl: lesson.videoUrl,
  pdfUrl: lesson.pdfUrl,
  isPreview: lesson.isPreview,
});

const emptyQuestion = (): QuizQuestion => ({
  id: createId('qq'),
  prompt: '',
  options: ['', '', ''],
  correct: 0,
  explain: '',
});

/** Text input that commits to the store on blur (avoids a write per keystroke). */
function CommitInput({
  value,
  onCommit,
  multiline = false,
  ...props
}: {
  value: string;
  onCommit: (value: string) => void;
  multiline?: boolean;
  id?: string;
  placeholder?: string;
  type?: string;
  min?: string;
  className?: string;
  'aria-label'?: string;
}) {
  const [draft, setDraft] = useState(value);
  const [lastValue, setLastValue] = useState(value);
  if (value !== lastValue) {
    setLastValue(value);
    setDraft(value);
  }
  const commit = () => {
    if (draft !== value) onCommit(draft);
  };
  return multiline ? (
    <textarea
      rows={5}
      {...props}
      className={cn('inp', props.className)}
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
    />
  ) : (
    <input
      {...props}
      className={cn('inp', props.className)}
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => event.key === 'Enter' && (event.target as HTMLInputElement).blur()}
    />
  );
}

export function EditorScreen() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const user = useCurrentUser();
  const db = useAppStore((state) => state.db);
  // Actions are stable functions, so reading them once is safe and avoids extra subscriptions.
  const actions = useAppStore.getState();
  const toast = useToast();
  const [lessonDraft, setLessonDraft] = useState<LessonDraft | null>(null);
  const [quizDraft, setQuizDraft] = useState<QuizInput | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{
    kind: 'module' | 'lesson';
    id: string;
    title: string;
  } | null>(null);

  const course = db.courses[id];
  const outline = useMemo(() => getCourseOutline(db, id), [db, id]);
  const categories = useMemo(() => {
    const names = sortByOrder(values(db.categories)).map((category) => category.name);
    return course && !names.includes(course.category) ? [course.category, ...names] : names;
  }, [db.categories, course]);

  const run = (action: () => void, success?: string) => {
    try {
      action();
      if (success) toast(success);
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  };

  if (!course) {
    return (
      <Screen title="Редактор курса" back="/profile?tab=courses">
        <div className="px-4 pt-6">
          <EmptyState
            title="Курс не найден"
            action={<Button onClick={() => navigate('/profile?tab=courses')}>В студию</Button>}
          />
        </div>
      </Screen>
    );
  }
  if (!user) {
    return (
      <Screen title="Редактор курса" back="/profile?tab=courses">
        <div className="px-4 pt-6">
          <EmptyState
            title="Войдите, чтобы редактировать курс"
            action={<Button onClick={() => navigate('/')}>В каталог</Button>}
          />
        </div>
      </Screen>
    );
  }
  if (!canEditCourse(course, user)) {
    return (
      <Screen title="Редактор курса" back="/profile?tab=courses">
        <div className="px-4 pt-6">
          <EmptyState
            title="Нет доступа"
            text="Этот курс принадлежит другому преподавателю."
            action={<Button onClick={() => navigate('/profile?tab=courses')}>В студию</Button>}
          />
        </div>
      </Screen>
    );
  }

  const update = (changes: Partial<Course>) => run(() => actions.updateCourse(course.id, changes));

  const saveLesson = () => {
    if (!lessonDraft) return;
    run(() => {
      actions.saveLesson(course.id, lessonDraft);
      setLessonDraft(null);
    });
  };

  const saveQuiz = () => {
    if (!quizDraft) return;
    run(() => {
      actions.saveQuiz(course.id, quizDraft);
      setQuizDraft(null);
    });
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    const target = pendingDelete;
    setPendingDelete(null);
    run(() =>
      target.kind === 'module' ? actions.deleteModule(target.id) : actions.deleteLesson(target.id),
    );
  };

  const openQuiz = (moduleId: string) => {
    const existing = outline.quizByModule[moduleId];
    setQuizDraft(
      existing
        ? {
            id: existing.id,
            moduleId,
            title: existing.title,
            questions: existing.questions.map((question) => ({
              ...question,
              options: [...question.options],
            })),
          }
        : { id: null, moduleId, title: 'Тест модуля', questions: [] },
    );
  };

  const updateQuestion = (index: number, changes: Partial<QuizQuestion>) =>
    setQuizDraft((draft) =>
      draft
        ? {
            ...draft,
            questions: draft.questions.map((question, position) =>
              position === index ? { ...question, ...changes } : question,
            ),
          }
        : draft,
    );

  return (
    <Screen
      title="Редактор курса"
      back="/profile?tab=courses"
      actions={
        <button
          type="button"
          onClick={() => navigate(`/course/${course.id}`)}
          aria-label="Просмотр курса"
          className="pressable flex h-10 w-10 items-center justify-center rounded-full"
        >
          <Eye size={20} />
        </button>
      }
      footer={
        <Button
          size="lg"
          className="w-full"
          onClick={() =>
            run(() => actions.submitForModeration(course.id), 'Курс отправлен на модерацию')
          }
          disabled={course.status === 'pending'}
        >
          <Send size={16} aria-hidden />
          {course.status === 'pending' ? 'На модерации' : 'Отправить на модерацию'}
        </Button>
      }
    >
      <div className="px-4">
        <div className="mb-3 flex items-center gap-2">
          <Badge tone={STATUS_TONES[course.status]}>{STATUS_LABELS[course.status]}</Badge>
          <span className="muted min-w-0 truncate text-[13px]">{course.title}</span>
        </div>

        <section className="card p-4" aria-labelledby="about-title">
          <h2 id="about-title" className="font-display text-[15px]">
            О курсе
          </h2>
          <div className="mt-3 grid grid-cols-1 gap-3">
            <Field label="Название">
              <CommitInput value={course.title} onCommit={(title) => update({ title })} />
            </Field>
            <Field label="Подзаголовок">
              <CommitInput value={course.subtitle} onCommit={(subtitle) => update({ subtitle })} />
            </Field>
            <Field label="Предмет" hint="Направление, по которому курс ищут в каталоге">
              <PickerField
                title="Предмет"
                value={course.category}
                onChange={(category) => update({ category })}
                options={categories.map((name) => ({ value: name, label: name }))}
              />
            </Field>
            <Field label="Экзамен">
              <PickerField<CourseExam>
                title="Экзамен"
                value={course.exam}
                onChange={(exam) => update({ exam })}
                options={COURSE_EXAM_OPTIONS.map((option) => ({
                  value: option.id,
                  label: option.label,
                }))}
              />
            </Field>
            <Field label="Цена, ₽" hint="0 — курс бесплатный">
              <CommitInput
                type="number"
                min="0"
                value={String(course.price)}
                onCommit={(price) => update({ price: Number(price) })}
              />
            </Field>
            <div>
              <p className="muted mb-1.5 block text-[12.5px] font-medium uppercase tracking-wide">
                Цвет обложки
              </p>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Цвет обложки">
                {TONES.map((tone) => (
                  <button
                    key={tone.id}
                    type="button"
                    role="radio"
                    aria-checked={course.tone === tone.id}
                    aria-label={tone.id}
                    onClick={() => update({ tone: tone.id })}
                    className={cn(
                      'h-9 w-9 rounded-lg transition',
                      course.tone === tone.id &&
                        'ring-2 ring-[rgb(var(--color-secondary))] ring-offset-2 ring-offset-[rgb(var(--surface))]',
                    )}
                    style={{ background: `linear-gradient(140deg, ${tone.from}, ${tone.to})` }}
                  />
                ))}
              </div>
              <span className="muted mt-1 block text-xs">Подложка под фото обложки</span>
            </div>
          </div>
          <div className="mt-3">
            <Field
              label="Фото обложки"
              hint="Ссылка на изображение (https://…). У каждого курса — своё фото."
            >
              <CommitInput
                value={course.coverUrl}
                onCommit={(coverUrl) => update({ coverUrl: coverUrl.trim() })}
                placeholder="https://example.com/cover.jpg"
              />
            </Field>
          </div>
          <div className="mt-3">
            <Field label="Описание">
              <CommitInput
                multiline
                value={course.description}
                onCommit={(description) => update({ description })}
                placeholder="Чему научится ученик, для кого курс, какой результат"
              />
            </Field>
          </div>
          <p className="muted mt-2 text-[12px]">
            {pluralize(outline.metrics.modulesCount, WORDS.module)} ·{' '}
            {pluralize(outline.metrics.lessonsCount, WORDS.lesson)} ·{' '}
            {formatDuration(outline.metrics.totalMinutes)}
          </p>
        </section>

        <section className="mt-5" aria-labelledby="program-title">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="program-title" className="font-display text-lg">
              Программа
            </h2>
            <Button
              size="sm"
              variant="soft"
              onClick={() => run(() => actions.addModule(course.id))}
            >
              <Plus size={14} aria-hidden /> Модуль
            </Button>
          </div>
          <div className="flex flex-col gap-3">
            {outline.modules.map((module, moduleIndex) => {
              const lessons = outline.lessonsByModule[module.id] ?? [];
              const quiz = outline.quizByModule[module.id];
              return (
                <div key={module.id} className="card overflow-hidden">
                  <div className="hairline-b flex items-center gap-2 px-3 py-2.5">
                    <span className="soft-bg flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-semibold">
                      {moduleIndex + 1}
                    </span>
                    <CommitInput
                      value={module.title}
                      onCommit={(title) => run(() => actions.renameModule(module.id, title))}
                      className="!min-w-0 !flex-1 !border-0 !bg-transparent !p-0 !text-[14px] !font-medium !shadow-none"
                      aria-label="Название модуля"
                    />
                    <button
                      type="button"
                      onClick={() => run(() => actions.moveModule(module.id, -1))}
                      disabled={moduleIndex === 0}
                      className="hover-dim rounded p-1.5 disabled:opacity-30"
                      aria-label="Переместить модуль выше"
                    >
                      <ChevronUp size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => run(() => actions.moveModule(module.id, 1))}
                      disabled={moduleIndex === outline.modules.length - 1}
                      className="hover-dim rounded p-1.5 disabled:opacity-30"
                      aria-label="Переместить модуль ниже"
                    >
                      <ChevronDown size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setPendingDelete({ kind: 'module', id: module.id, title: module.title })
                      }
                      className="hover-dim rounded p-1.5 text-red-500"
                      aria-label="Удалить модуль"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <ul className="divide-y divide-[rgb(var(--line)/0.08)]">
                    {lessons.map((lesson, lessonIndex) => (
                      <li
                        key={lesson.id}
                        className="flex flex-wrap items-center gap-x-2 gap-y-1 px-3 py-2.5"
                      >
                        <span className="muted w-4 shrink-0 text-[11px]">{lessonIndex + 1}</span>
                        <button
                          type="button"
                          onClick={() => setLessonDraft(toDraft(lesson))}
                          className="min-w-0 flex-1 basis-[calc(100%-1.5rem)] truncate text-left text-[13.5px] hover:underline"
                        >
                          {lesson.title}
                        </button>
                        <div className="ml-6 flex items-center gap-2">
                          {lesson.isPreview && <Badge tone="ok">Пробный</Badge>}
                          <span className="muted shrink-0 text-[11px]">
                            {formatDuration(lesson.duration)}
                          </span>
                          <button
                            type="button"
                            onClick={() => run(() => actions.moveLesson(lesson.id, -1))}
                            disabled={lessonIndex === 0}
                            className="hover-dim rounded p-1 disabled:opacity-30"
                            aria-label="Переместить урок выше"
                          >
                            <ChevronUp size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => run(() => actions.moveLesson(lesson.id, 1))}
                            disabled={lessonIndex === lessons.length - 1}
                            className="hover-dim rounded p-1 disabled:opacity-30"
                            aria-label="Переместить урок ниже"
                          >
                            <ChevronDown size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setPendingDelete({
                                kind: 'lesson',
                                id: lesson.id,
                                title: lesson.title,
                              })
                            }
                            className="hover-dim rounded p-1 text-red-500"
                            aria-label="Удалить урок"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </li>
                    ))}
                    {lessons.length === 0 && (
                      <li className="muted px-3 py-2.5 text-[12.5px]">Нет уроков</li>
                    )}
                  </ul>
                  <div className="hairline-t flex flex-wrap gap-2 px-3 py-2.5">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setLessonDraft(emptyLesson(module.id))}
                    >
                      <Plus size={14} aria-hidden /> Урок
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => openQuiz(module.id)}>
                      <Award size={14} aria-hidden /> {quiz ? 'Изменить тест' : 'Добавить тест'}
                    </Button>
                    {quiz && (
                      <span className="muted self-center text-[11.5px]">
                        {pluralize(quiz.questions.length, WORDS.question)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            {outline.modules.length === 0 && (
              <EmptyState
                icon={WandSparkles}
                title="Программа пуста"
                text="Начните с модуля — например, «Введение»."
                action={
                  <Button size="sm" onClick={() => run(() => actions.addModule(course.id))}>
                    Добавить модуль
                  </Button>
                }
              />
            )}
          </div>
        </section>

        <ConfirmSheet
          open={Boolean(pendingDelete)}
          title="Подтвердите удаление"
          message={`Удалить «${pendingDelete?.title ?? ''}»?${
            pendingDelete?.kind === 'module' ? ' Вместе с уроками и тестом модуля.' : ''
          } Это действие необратимо.`}
          confirmLabel="Удалить"
          destructive
          onClose={() => setPendingDelete(null)}
          onConfirm={confirmDelete}
        />

        <Sheet
          open={Boolean(lessonDraft)}
          onClose={() => setLessonDraft(null)}
          title={lessonDraft?.id ? 'Редактировать урок' : 'Новый урок'}
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setLessonDraft(null)}>
                Отмена
              </Button>
              <Button onClick={saveLesson} disabled={!lessonDraft?.title.trim()}>
                <Save size={15} aria-hidden /> Сохранить
              </Button>
            </div>
          }
        >
          {lessonDraft && (
            <div className="flex flex-col gap-3">
              <Field label="Название">
                <input
                  value={lessonDraft.title}
                  onChange={(event) =>
                    setLessonDraft({ ...lessonDraft, title: event.target.value })
                  }
                  className="inp"
                  autoFocus
                />
              </Field>
              <div className="grid grid-cols-2 items-end gap-3">
                <Field label="Тип">
                  <PickerField<LessonType>
                    title="Тип урока"
                    value={lessonDraft.type}
                    onChange={(type) => setLessonDraft({ ...lessonDraft, type })}
                    options={LESSON_TYPES.map((type) => ({ value: type.id, label: type.label }))}
                  />
                </Field>
                <Field label="Длительность, мин">
                  <input
                    type="number"
                    min="0"
                    value={lessonDraft.duration}
                    onChange={(event) =>
                      setLessonDraft({ ...lessonDraft, duration: Number(event.target.value) })
                    }
                    className="inp"
                  />
                </Field>
              </div>
              {lessonDraft.type === 'video' && (
                <Field label="Ссылка на видео" hint="MP4-файл или ссылка YouTube / Vimeo">
                  <input
                    value={lessonDraft.videoUrl}
                    onChange={(event) =>
                      setLessonDraft({ ...lessonDraft, videoUrl: event.target.value })
                    }
                    className="inp"
                    placeholder="https://…"
                  />
                </Field>
              )}
              {lessonDraft.type === 'pdf' && (
                <Field label="Ссылка на PDF">
                  <input
                    value={lessonDraft.pdfUrl}
                    onChange={(event) =>
                      setLessonDraft({ ...lessonDraft, pdfUrl: event.target.value })
                    }
                    className="inp"
                    placeholder="https://…"
                  />
                </Field>
              )}
              <Field label="Текст урока" hint="Отображается под видео — конспект, задание, ссылки">
                <textarea
                  rows={7}
                  value={lessonDraft.content}
                  onChange={(event) =>
                    setLessonDraft({ ...lessonDraft, content: event.target.value })
                  }
                  className="inp"
                />
              </Field>
              <label className="flex cursor-pointer items-center gap-2.5 text-[13.5px]">
                <input
                  className="checkbox"
                  type="checkbox"
                  checked={lessonDraft.isPreview}
                  onChange={(event) =>
                    setLessonDraft({ ...lessonDraft, isPreview: event.target.checked })
                  }
                />
                Пробный урок — доступен без записи
              </label>
            </div>
          )}
        </Sheet>

        <Sheet
          open={Boolean(quizDraft)}
          tall
          onClose={() => setQuizDraft(null)}
          title="Тест модуля"
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setQuizDraft(null)}>
                Отмена
              </Button>
              <Button onClick={saveQuiz}>
                <Save size={15} aria-hidden /> Сохранить тест
              </Button>
            </div>
          }
        >
          {quizDraft && (
            <div className="flex flex-col gap-4">
              <Field label="Название теста">
                <input
                  value={quizDraft.title}
                  onChange={(event) => setQuizDraft({ ...quizDraft, title: event.target.value })}
                  className="inp"
                />
              </Field>
              {quizDraft.questions.map((question, questionIndex) => (
                <div key={question.id} className="bd rounded-2xl p-3">
                  <div className="flex items-center gap-2">
                    <span className="muted text-[12px] font-semibold">
                      Вопрос {questionIndex + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setQuizDraft({
                          ...quizDraft,
                          questions: quizDraft.questions.filter(
                            (_, position) => position !== questionIndex,
                          ),
                        })
                      }
                      className="hover-dim ml-auto rounded p-1 text-red-500"
                      aria-label={`Удалить вопрос ${questionIndex + 1}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <input
                    value={question.prompt}
                    onChange={(event) =>
                      updateQuestion(questionIndex, { prompt: event.target.value })
                    }
                    className="inp mt-2"
                    placeholder="Формулировка вопроса"
                    aria-label={`Формулировка вопроса ${questionIndex + 1}`}
                  />
                  <div className="mt-2 flex flex-col gap-1.5">
                    {question.options.map((option, optionIndex) => (
                      <div key={optionIndex} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateQuestion(questionIndex, { correct: optionIndex })}
                          aria-pressed={question.correct === optionIndex}
                          aria-label={`Вариант ${optionLetter(optionIndex)} — верный ответ`}
                          className={cn(
                            'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px]',
                            question.correct === optionIndex
                              ? 'bg-emerald-500 text-white'
                              : 'bd muted',
                          )}
                        >
                          {optionLetter(optionIndex)}
                        </button>
                        <input
                          value={option}
                          onChange={(event) =>
                            updateQuestion(questionIndex, {
                              options: question.options.map((text, position) =>
                                position === optionIndex ? event.target.value : text,
                              ),
                            })
                          }
                          className="inp !py-1.5 text-[13px]"
                          placeholder={`Вариант ${optionLetter(optionIndex)}`}
                        />
                      </div>
                    ))}
                  </div>
                  <input
                    value={question.explain}
                    onChange={(event) =>
                      updateQuestion(questionIndex, { explain: event.target.value })
                    }
                    className="inp mt-2 !py-1.5 text-[13px]"
                    placeholder="Пояснение к ответу (необязательно)"
                  />
                  <div className="mt-2 flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        updateQuestion(questionIndex, { options: [...question.options, ''] })
                      }
                    >
                      <Plus size={13} aria-hidden /> Вариант
                    </Button>
                    <span className="muted text-[11.5px]">зелёная буква — верный ответ</span>
                  </div>
                </div>
              ))}
              <Button
                variant="soft"
                onClick={() =>
                  setQuizDraft({
                    ...quizDraft,
                    questions: [...quizDraft.questions, emptyQuestion()],
                  })
                }
              >
                <Plus size={15} aria-hidden /> Добавить вопрос
              </Button>
              <p className="muted text-[11.5px]">
                Пустые вопросы и варианты не сохраняются. В вопросе должно быть минимум два
                варианта.
              </p>
            </div>
          )}
        </Sheet>
      </div>
    </Screen>
  );
}
