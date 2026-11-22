import { certificateNumber } from '@/entities/certificate/lib';
import { applyPromo, enrollmentId, normalizePromoCode } from '@/entities/enrollment/lib';
import { gradeQuiz, type QuizAnswers } from '@/entities/quiz/lib';
import type {
  Certificate,
  Enrollment,
  ID,
  LessonProgress,
  PromoCode,
  QuizResult,
  Review,
} from '@/entities/types';
import { DomainError } from '../errors';
import { upsert, values } from '../table';
import type { SliceCreator, StoreDeps } from '../types';
import { requireCourse, requireUser } from './guards';

export interface LearningSlice {
  /** Returns an active promo code or throws a user-facing error. */
  findPromo: (code: string) => PromoCode;
  /**
   * Enrolls the current user. For paid courses this is called after the
   * (demo) checkout succeeded; the paid amount is recorded for statistics.
   */
  enroll: (courseId: ID, promoCode?: string | null) => Enrollment;
  setLessonCompleted: (lessonId: ID, completed: boolean) => void;
  submitQuiz: (quizId: ID, answers: QuizAnswers) => QuizResult;
  issueCertificate: (courseId: ID) => Certificate;
  saveReview: (courseId: ID, input: { rating: number; text: string }) => Review;
}

export const createLearningSlice =
  (deps: StoreDeps): SliceCreator<LearningSlice> =>
  (set, get) => ({
    findPromo: (code) => {
      const normalized = normalizePromoCode(code);
      const promo = values(get().db.promoCodes).find((item) => item.code === normalized);
      if (!promo || !promo.active)
        throw new DomainError('Промокод не найден или больше не действует');
      return promo;
    },

    enroll: (courseId, promoCode = null) => {
      const state = get();
      const user = requireUser(state);
      const course = requireCourse(state, courseId);
      const id = enrollmentId(user.id, course.id);
      const existing = state.db.enrollments[id];
      if (existing) return existing;
      if (course.status !== 'published') throw new DomainError('Курс ещё не опубликован');

      const promo = promoCode && course.price > 0 ? get().findPromo(promoCode) : null;
      const enrollment: Enrollment = {
        id,
        userId: user.id,
        userName: user.displayName,
        courseId: course.id,
        courseTitle: course.title,
        teacherId: course.teacherId,
        amount: applyPromo(course.price, promo),
        promoCode: promo?.code ?? null,
        createdAt: deps.now().toISOString(),
      };
      set({ db: { ...state.db, enrollments: upsert(state.db.enrollments, enrollment) } });
      return enrollment;
    },

    setLessonCompleted: (lessonId, completed) => {
      const state = get();
      const user = requireUser(state);
      const lesson = state.db.lessons[lessonId];
      if (!lesson) throw new DomainError('Урок не найден');
      const record: LessonProgress = {
        id: `${user.id}:${lesson.id}`,
        userId: user.id,
        courseId: lesson.courseId,
        lessonId: lesson.id,
        completed,
        completedAt: completed ? deps.now().toISOString() : null,
      };
      set({ db: { ...state.db, lessonProgress: upsert(state.db.lessonProgress, record) } });
    },

    submitQuiz: (quizId, answers) => {
      const state = get();
      const user = requireUser(state);
      const quiz = state.db.quizzes[quizId];
      if (!quiz) throw new DomainError('Тест не найден');
      const grade = gradeQuiz(quiz, answers);
      const result: QuizResult = {
        id: `${user.id}:${quiz.id}`,
        userId: user.id,
        courseId: quiz.courseId,
        quizId: quiz.id,
        ...grade,
        takenAt: deps.now().toISOString(),
      };
      set({ db: { ...state.db, quizResults: upsert(state.db.quizResults, result) } });
      return result;
    },

    issueCertificate: (courseId) => {
      const state = get();
      const user = requireUser(state);
      const course = requireCourse(state, courseId);
      const lessons = values(state.db.lessons).filter((lesson) => lesson.courseId === courseId);
      const done = new Set(
        values(state.db.lessonProgress)
          .filter((item) => item.userId === user.id && item.courseId === courseId && item.completed)
          .map((item) => item.lessonId),
      );
      if (lessons.length === 0 || lessons.some((lesson) => !done.has(lesson.id))) {
        throw new DomainError('Курс ещё не завершён');
      }
      const id = certificateNumber(user.id, course.id);
      const existing = state.db.certificates[id];
      if (existing) return existing;
      const certificate: Certificate = {
        id,
        userId: user.id,
        userName: user.displayName,
        courseId: course.id,
        courseTitle: course.title,
        teacherName: course.teacherName,
        issuedAt: deps.now().toISOString(),
      };
      set({ db: { ...state.db, certificates: upsert(state.db.certificates, certificate) } });
      return certificate;
    },

    saveReview: (courseId, { rating, text }) => {
      const state = get();
      const user = requireUser(state);
      const course = requireCourse(state, courseId);
      if (!state.db.enrollments[enrollmentId(user.id, courseId)]) {
        throw new DomainError('Отзыв могут оставить только ученики курса');
      }
      const trimmed = text.trim();
      if (!trimmed) throw new DomainError('Напишите пару слов о курсе');
      const review: Review = {
        id: `rev-${user.id}-${course.id}`,
        courseId: course.id,
        teacherId: course.teacherId,
        userId: user.id,
        userName: user.displayName,
        rating: Math.min(5, Math.max(1, Math.round(rating))),
        text: trimmed,
        createdAt: deps.now().toISOString(),
      };
      set({ db: { ...state.db, reviews: upsert(state.db.reviews, review) } });
      return review;
    },
  });
