import { beforeEach, describe, expect, it } from 'vitest';
import { buildSeed, DEMO_OWNER_ID, DEMO_STUDENT_ID, DEMO_TEACHER_ID } from '@/data/seed';
import { DRAFT_COURSE_ID } from '@/data/catalog';
import { certificateNumber } from '@/entities/certificate/lib';
import { TEST_NOW } from '@/test/utils';
import { createAppStore, type AppStore } from './appStore';
import { DomainError } from './errors';
import { getCourseOutline } from './selectors';
import { values } from './table';

let store: AppStore;
const state = () => store.getState();

beforeEach(() => {
  store = createAppStore({ now: () => TEST_NOW, seed: () => buildSeed(TEST_NOW) });
});

describe('auth', () => {
  it('signs into demo accounts and out', () => {
    state().signIn(DEMO_STUDENT_ID);
    expect(state().session.userId).toBe(DEMO_STUDENT_ID);
    state().signOut();
    expect(state().session.userId).toBeNull();
  });

  it('creates a student on first e-mail sign-in and reuses it later', () => {
    const first = state().signInWithEmail({ name: 'Пётр', email: 'Petr@Mail.ru ' });
    expect(first).toMatchObject({ email: 'petr@mail.ru', displayName: 'Пётр', role: 'student' });
    state().signOut();
    const second = state().signInWithEmail({ name: '', email: 'petr@mail.ru' });
    expect(second.id).toBe(first.id);
  });

  it('rejects invalid e-mails and unknown accounts', () => {
    expect(() => state().signInWithEmail({ name: 'x', email: 'nope' })).toThrow(DomainError);
    expect(() => state().signIn('missing')).toThrow('Аккаунт не найден');
  });

  it('updates the profile and keeps a non-empty name', () => {
    state().signIn(DEMO_STUDENT_ID);
    state().updateProfile({ displayName: '   ', headline: ' 11 класс ', role: 'teacher' });
    const user = state().db.users[DEMO_STUDENT_ID]!;
    expect(user.displayName).toBe('Алиса Смирнова');
    expect(user.headline).toBe('11 класс');
    expect(user.role).toBe('teacher');
  });

  it('stores the exam goal of a student', () => {
    state().signIn(DEMO_STUDENT_ID);
    state().setGoal({ exam: 'ege', courseId: 'k-math' });
    expect(state().db.users[DEMO_STUDENT_ID]?.goal).toEqual({ exam: 'ege', courseId: 'k-math' });
    expect(() => state().setGoal({ exam: 'oge', courseId: 'missing' })).toThrow('Курс не найден');
  });
});

describe('learning', () => {
  beforeEach(() => state().signIn(DEMO_STUDENT_ID));

  it('requires authentication to enroll', () => {
    state().signOut();
    expect(() => state().enroll('sp-geo-students')).toThrow('Сначала войдите в аккаунт');
  });

  it('enrolls into a free course for 0 ₽ and is idempotent', () => {
    const enrollment = state().enroll('sp-geo-students');
    expect(enrollment.amount).toBe(0);
    expect(state().enroll('sp-geo-students')).toBe(enrollment);
  });

  it('records the paid amount with a promo code', () => {
    const enrollment = state().enroll('sp-geo-ege-expert', 'ege2026');
    expect(enrollment).toMatchObject({
      amount: 1992,
      promoCode: 'EGE2026',
      teacherId: 't-belskaya',
    });
  });

  it('rejects unknown or inactive promo codes', () => {
    expect(() => state().findPromo('SUMMER50')).toThrow(/не найден/);
    expect(() => state().enroll('sp-geo-ege-expert', 'WRONG')).toThrow(/не найден/);
  });

  it('does not enroll into unpublished courses', () => {
    expect(() => state().enroll(DRAFT_COURSE_ID)).toThrow('Курс ещё не опубликован');
  });

  it('tracks progress, grades quizzes and issues a certificate at 100%', () => {
    const courseId = 'sp-geo-students';
    state().enroll(courseId);
    const outline = getCourseOutline(state().db, courseId);
    expect(() => state().issueCertificate(courseId)).toThrow('Курс ещё не завершён');

    for (const lesson of outline.lessons) state().setLessonCompleted(lesson.id, true);
    const quiz = Object.values(outline.quizByModule)[0]!;
    const answers = Object.fromEntries(
      quiz.questions.map((question, index) => [index, question.correct]),
    );
    expect(state().submitQuiz(quiz.id, answers)).toMatchObject({ score: 100, passed: true });

    const certificate = state().issueCertificate(courseId);
    expect(certificate.id).toBe(certificateNumber(DEMO_STUDENT_ID, courseId));
    expect(state().issueCertificate(courseId)).toBe(certificate);

    state().setLessonCompleted(outline.lessons[0]!.id, false);
    expect(
      state().db.lessonProgress[`${DEMO_STUDENT_ID}:${outline.lessons[0]!.id}`]?.completed,
    ).toBe(false);
  });

  it('lets only enrolled students review, one review per course', () => {
    expect(() => state().saveReview('sp-geo-students', { rating: 5, text: 'Супер' })).toThrow(
      /только ученики/,
    );
    state().enroll('sp-geo-students');
    expect(() => state().saveReview('sp-geo-students', { rating: 5, text: '  ' })).toThrow();
    state().saveReview('sp-geo-students', { rating: 9, text: 'Супер' });
    state().saveReview('sp-geo-students', { rating: 4, text: 'Обновил отзыв' });
    const own = values(state().db.reviews).filter(
      (review) => review.userId === DEMO_STUDENT_ID && review.courseId === 'sp-geo-students',
    );
    expect(own).toHaveLength(1);
    expect(own[0]).toMatchObject({ rating: 4, text: 'Обновил отзыв' });
  });
});

describe('studio', () => {
  it('only teachers create courses', () => {
    state().signIn(DEMO_STUDENT_ID);
    expect(() => state().createCourse('Курс')).toThrow(/преподаватели/);
  });

  it('creates a draft with a unique cover and builds its programme', () => {
    state().signIn(DEMO_TEACHER_ID);
    const course = state().createCourse('  ');
    expect(course).toMatchObject({
      title: 'Новый курс',
      status: 'draft',
      teacherId: DEMO_TEACHER_ID,
    });
    const covers = values(state().db.courses).map((item) => item.coverUrl);
    expect(covers.filter((url) => url === course.coverUrl)).toHaveLength(1);

    expect(() => state().submitForModeration(course.id)).toThrow(/хотя бы один модуль/);

    const first = state().addModule(course.id);
    const second = state().addModule(course.id);
    expect(second.title).toBe('Модуль 2');
    state().renameModule(first.id, 'Введение');
    state().moveModule(second.id, -1);
    let outline = getCourseOutline(state().db, course.id);
    expect(outline.modules.map((module) => module.id)).toEqual([second.id, first.id]);

    const base = {
      type: 'text' as const,
      duration: 10,
      content: '',
      videoUrl: 'x',
      pdfUrl: 'y',
      isPreview: true,
    };
    expect(() =>
      state().saveLesson(course.id, { ...base, moduleId: first.id, title: ' ' }),
    ).toThrow();
    const a = state().saveLesson(course.id, { ...base, moduleId: first.id, title: 'Урок A' });
    const b = state().saveLesson(course.id, { ...base, moduleId: first.id, title: 'Урок B' });
    expect(a.videoUrl).toBe('');
    state().moveLesson(b.id, -1);
    outline = getCourseOutline(state().db, course.id);
    expect(outline.lessonsByModule[first.id]?.map((lesson) => lesson.title)).toEqual([
      'Урок B',
      'Урок A',
    ]);

    const quiz = state().saveQuiz(course.id, {
      moduleId: first.id,
      title: '',
      questions: [
        { id: '1', prompt: '2+2?', options: ['3', '4', ''], correct: 1, explain: '' },
        { id: '2', prompt: '', options: ['a', 'b'], correct: 0, explain: '' },
      ],
    });
    expect(quiz.title).toBe('Тест модуля');
    expect(quiz.questions).toHaveLength(1);
    // Saving again for the same module updates the existing quiz.
    expect(
      state().saveQuiz(course.id, { moduleId: first.id, title: 'Итог', questions: [] }).id,
    ).toBe(quiz.id);

    state().updateCourse(course.id, { price: -100, exam: 'oge', title: 'Геометрия' });
    expect(state().db.courses[course.id]).toMatchObject({
      price: 0,
      exam: 'oge',
      title: 'Геометрия',
    });

    state().submitForModeration(course.id);
    expect(state().db.courses[course.id]?.status).toBe('pending');

    state().deleteModule(first.id);
    outline = getCourseOutline(state().db, course.id);
    expect(outline.modules).toHaveLength(1);
    expect(outline.modules[0]?.order).toBe(0);
    expect(values(state().db.lessons).some((lesson) => lesson.moduleId === first.id)).toBe(false);
    expect(values(state().db.quizzes).some((item) => item.moduleId === first.id)).toBe(false);
  });

  it('forbids editing another teacher’s course', () => {
    state().signIn(DEMO_TEACHER_ID);
    expect(() => state().updateCourse('k-math', { title: 'Чужой' })).toThrow(
      /другому преподавателю/,
    );
    expect(() => state().addModule('k-math')).toThrow(DomainError);
  });
});

describe('admin', () => {
  it('requires the platform owner', () => {
    state().signIn(DEMO_TEACHER_ID);
    expect(() => state().setCourseStatus(DRAFT_COURSE_ID, 'published')).toThrow(/администратору/);
  });

  it('moderates courses and manages subjects', () => {
    state().signIn(DEMO_OWNER_ID);
    state().setCourseStatus(DRAFT_COURSE_ID, 'published');
    expect(state().db.courses[DRAFT_COURSE_ID]?.status).toBe('published');

    const category = state().addCategory(' Астрономия ');
    expect(category.name).toBe('Астрономия');
    expect(() => state().addCategory('астрономия')).toThrow(/уже есть/);
    state().deleteCategory(category.id);
    expect(state().db.categories[category.id]).toBeUndefined();

    const enrollmentsBefore = values(state().db.enrollments).filter(
      (item) => item.courseId === 'k-math',
    ).length;
    state().deleteCourse('k-math');
    expect(state().db.courses['k-math']).toBeUndefined();
    expect(values(state().db.lessons).some((lesson) => lesson.courseId === 'k-math')).toBe(false);
    // Financial history is preserved.
    expect(
      values(state().db.enrollments).filter((item) => item.courseId === 'k-math'),
    ).toHaveLength(enrollmentsBefore);
  });

  it('resets the demo database', () => {
    state().signIn(DEMO_OWNER_ID);
    state().deleteCourse('k-math');
    state().resetDemo();
    expect(state().db.courses['k-math']).toBeDefined();
    expect(state().session.userId).toBeNull();
  });
});
