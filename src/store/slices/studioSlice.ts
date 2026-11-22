import { pickFreeCover, sortByOrder } from '@/entities/course/lib';
import { sanitizeQuestions } from '@/entities/quiz/lib';
import type { Course, CourseModule, ID, Lesson, Quiz, QuizQuestion } from '@/entities/types';
import { createId } from '@/shared/lib/id';
import { DomainError } from '../errors';
import { patch, removeWhere, upsert, values } from '../table';
import type { SliceCreator, StoreDeps } from '../types';
import { requireEditableCourse, requireUser } from './guards';

export type CoursePatch = Partial<
  Pick<
    Course,
    'title' | 'subtitle' | 'description' | 'category' | 'exam' | 'price' | 'tone' | 'coverUrl'
  >
>;

export type LessonInput = Pick<
  Lesson,
  'moduleId' | 'title' | 'type' | 'duration' | 'content' | 'videoUrl' | 'pdfUrl' | 'isPreview'
> & { id?: ID };

export interface QuizInput {
  id?: ID | null;
  moduleId: ID;
  title: string;
  questions: QuizQuestion[];
}

export type Direction = -1 | 1;

export interface StudioSlice {
  createCourse: (title: string) => Course;
  updateCourse: (courseId: ID, changes: CoursePatch) => void;
  submitForModeration: (courseId: ID) => void;
  addModule: (courseId: ID) => CourseModule;
  renameModule: (moduleId: ID, title: string) => void;
  deleteModule: (moduleId: ID) => void;
  moveModule: (moduleId: ID, direction: Direction) => void;
  saveLesson: (courseId: ID, input: LessonInput) => Lesson;
  deleteLesson: (lessonId: ID) => void;
  moveLesson: (lessonId: ID, direction: Direction) => void;
  saveQuiz: (courseId: ID, input: QuizInput) => Quiz;
}

/** Swaps an item with its neighbour and renumbers `order` densely. */
function reorder<T extends { id: ID; order: number }>(items: T[], id: ID, direction: Direction) {
  const sorted = sortByOrder(items);
  const index = sorted.findIndex((item) => item.id === id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= sorted.length) return null;
  [sorted[index], sorted[target]] = [sorted[target] as T, sorted[index] as T];
  return sorted.map((item, order) => ({ ...item, order }));
}

export const createStudioSlice =
  (deps: StoreDeps): SliceCreator<StudioSlice> =>
  (set, get) => {
    const touch = (courseId: ID) => {
      const { db } = get();
      set({
        db: {
          ...db,
          courses: patch(db.courses, courseId, { updatedAt: deps.now().toISOString() }),
        },
      });
    };

    return {
      createCourse: (title) => {
        const state = get();
        const user = requireUser(state);
        if (user.role !== 'teacher' && !user.isOwner) {
          throw new DomainError('Создавать курсы могут только преподаватели');
        }
        const now = deps.now().toISOString();
        const firstCategory = sortByOrder(values(state.db.categories))[0]?.name ?? 'Математика';
        const course: Course = {
          id: createId('c'),
          title: title.trim() || 'Новый курс',
          subtitle: '',
          description: '',
          category: firstCategory,
          exam: 'ege',
          format: 'expert',
          price: 0,
          tone: 'violet',
          coverUrl: pickFreeCover(values(state.db.courses)),
          coverCredit: 'Unsplash',
          teacherId: user.id,
          teacherName: user.displayName,
          teacherHeadline: user.headline,
          teacherBio: user.bio,
          status: 'draft',
          createdAt: now,
          updatedAt: now,
        };
        set({ db: { ...state.db, courses: upsert(state.db.courses, course) } });
        return course;
      },

      updateCourse: (courseId, changes) => {
        const state = get();
        requireEditableCourse(state, courseId);
        const next: CoursePatch = { ...changes };
        if (next.price !== undefined) next.price = Math.max(0, Math.round(Number(next.price) || 0));
        if (next.title !== undefined) next.title = next.title.trim() || 'Новый курс';
        set({
          db: {
            ...state.db,
            courses: patch(state.db.courses, courseId, {
              ...next,
              updatedAt: deps.now().toISOString(),
            }),
          },
        });
      },

      submitForModeration: (courseId) => {
        const state = get();
        requireEditableCourse(state, courseId);
        const hasLessons = values(state.db.lessons).some((lesson) => lesson.courseId === courseId);
        if (!hasLessons) throw new DomainError('Добавьте хотя бы один модуль с уроком');
        set({
          db: {
            ...state.db,
            courses: patch(state.db.courses, courseId, {
              status: 'pending',
              updatedAt: deps.now().toISOString(),
            }),
          },
        });
      },

      addModule: (courseId) => {
        const state = get();
        requireEditableCourse(state, courseId);
        const count = values(state.db.modules).filter((item) => item.courseId === courseId).length;
        const module: CourseModule = {
          id: createId('m'),
          courseId,
          title: `Модуль ${count + 1}`,
          order: count,
        };
        set({ db: { ...state.db, modules: upsert(state.db.modules, module) } });
        touch(courseId);
        return module;
      },

      renameModule: (moduleId, title) => {
        const state = get();
        const module = state.db.modules[moduleId];
        if (!module) throw new DomainError('Модуль не найден');
        requireEditableCourse(state, module.courseId);
        set({
          db: {
            ...state.db,
            modules: patch(state.db.modules, moduleId, { title: title.trim() || module.title }),
          },
        });
      },

      deleteModule: (moduleId) => {
        const state = get();
        const module = state.db.modules[moduleId];
        if (!module) return;
        requireEditableCourse(state, module.courseId);
        const remaining = sortByOrder(
          values(state.db.modules).filter(
            (item) => item.courseId === module.courseId && item.id !== moduleId,
          ),
        ).map((item, order) => ({ ...item, order }));
        set({
          db: {
            ...state.db,
            modules: upsert(
              removeWhere(state.db.modules, (item) => item.id === moduleId),
              ...remaining,
            ),
            lessons: removeWhere(state.db.lessons, (lesson) => lesson.moduleId === moduleId),
            quizzes: removeWhere(state.db.quizzes, (quiz) => quiz.moduleId === moduleId),
          },
        });
        touch(module.courseId);
      },

      moveModule: (moduleId, direction) => {
        const state = get();
        const module = state.db.modules[moduleId];
        if (!module) return;
        requireEditableCourse(state, module.courseId);
        const siblings = values(state.db.modules).filter(
          (item) => item.courseId === module.courseId,
        );
        const reordered = reorder(siblings, moduleId, direction);
        if (!reordered) return;
        set({ db: { ...state.db, modules: upsert(state.db.modules, ...reordered) } });
      },

      saveLesson: (courseId, input) => {
        const state = get();
        requireEditableCourse(state, courseId);
        const title = input.title.trim();
        if (!title) throw new DomainError('Введите название урока');
        const module = state.db.modules[input.moduleId];
        if (!module || module.courseId !== courseId) throw new DomainError('Модуль не найден');
        const existing = input.id ? state.db.lessons[input.id] : undefined;
        const order =
          existing?.order ??
          values(state.db.lessons).filter((lesson) => lesson.moduleId === input.moduleId).length;
        const lesson: Lesson = {
          id: existing?.id ?? createId('l'),
          courseId,
          moduleId: input.moduleId,
          title,
          type: input.type,
          duration: Math.max(0, Math.round(Number(input.duration) || 0)),
          content: input.content,
          videoUrl: input.type === 'video' ? input.videoUrl.trim() : '',
          pdfUrl: input.type === 'pdf' ? input.pdfUrl.trim() : '',
          isPreview: input.isPreview,
          order,
        };
        set({ db: { ...state.db, lessons: upsert(state.db.lessons, lesson) } });
        touch(courseId);
        return lesson;
      },

      deleteLesson: (lessonId) => {
        const state = get();
        const lesson = state.db.lessons[lessonId];
        if (!lesson) return;
        requireEditableCourse(state, lesson.courseId);
        const remaining = sortByOrder(
          values(state.db.lessons).filter(
            (item) => item.moduleId === lesson.moduleId && item.id !== lessonId,
          ),
        ).map((item, order) => ({ ...item, order }));
        set({
          db: {
            ...state.db,
            lessons: upsert(
              removeWhere(state.db.lessons, (item) => item.id === lessonId),
              ...remaining,
            ),
          },
        });
        touch(lesson.courseId);
      },

      moveLesson: (lessonId, direction) => {
        const state = get();
        const lesson = state.db.lessons[lessonId];
        if (!lesson) return;
        requireEditableCourse(state, lesson.courseId);
        const siblings = values(state.db.lessons).filter(
          (item) => item.moduleId === lesson.moduleId,
        );
        const reordered = reorder(siblings, lessonId, direction);
        if (!reordered) return;
        set({ db: { ...state.db, lessons: upsert(state.db.lessons, ...reordered) } });
      },

      saveQuiz: (courseId, input) => {
        const state = get();
        requireEditableCourse(state, courseId);
        const module = state.db.modules[input.moduleId];
        if (!module || module.courseId !== courseId) throw new DomainError('Модуль не найден');
        const existing =
          (input.id && state.db.quizzes[input.id]) ||
          values(state.db.quizzes).find((quiz) => quiz.moduleId === input.moduleId);
        const quiz: Quiz = {
          id: existing ? existing.id : createId('q'),
          courseId,
          moduleId: input.moduleId,
          title: input.title.trim() || 'Тест модуля',
          questions: sanitizeQuestions(input.questions),
        };
        set({ db: { ...state.db, quizzes: upsert(state.db.quizzes, quiz) } });
        touch(courseId);
        return quiz;
      },
    };
  };
