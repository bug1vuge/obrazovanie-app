import { describe, expect, it } from 'vitest';
import { values } from '@/store/table';
import { TEST_NOW } from '@/test/utils';
import { DRAFT_COURSE_ID } from './catalog';
import { buildSeed, DEMO_OWNER_ID, DEMO_STUDENT_ID, DEMO_TEACHER_ID } from './seed';

describe('demo seed', () => {
  const db = buildSeed(TEST_NOW);
  const courses = values(db.courses);
  const published = courses.filter((course) => course.status === 'published');

  it('reproduces the original catalog of 36 published courses', () => {
    expect(published).toHaveLength(36);
    expect(db.courses[DRAFT_COURSE_ID]?.status).toBe('pending');
  });

  it('gives every course its own cover photo (no repeated images)', () => {
    const covers = courses.map((course) => course.coverUrl);
    expect(covers.every(Boolean)).toBe(true);
    expect(new Set(covers).size).toBe(covers.length);
  });

  it('only targets ОГЭ/ЕГЭ', () => {
    for (const course of courses) expect(['oge', 'ege', 'both']).toContain(course.exam);
  });

  it('keeps references consistent', () => {
    for (const lesson of values(db.lessons)) {
      const module = db.modules[lesson.moduleId];
      expect(module, lesson.id).toBeDefined();
      expect(module?.courseId).toBe(lesson.courseId);
    }
    for (const quiz of values(db.quizzes)) {
      expect(db.modules[quiz.moduleId]?.courseId).toBe(quiz.courseId);
      expect(quiz.questions.length).toBeGreaterThanOrEqual(3);
      for (const question of quiz.questions) {
        expect(question.correct).toBeGreaterThanOrEqual(0);
        expect(question.correct).toBeLessThan(question.options.length);
      }
    }
    for (const course of courses) {
      expect(db.users[course.teacherId]?.role, course.id).toBe('teacher');
    }
    for (const enrollment of values(db.enrollments)) {
      expect(db.users[enrollment.userId]).toBeDefined();
      expect(db.courses[enrollment.courseId]).toBeDefined();
      expect(enrollment.amount).toBeLessThanOrEqual(db.courses[enrollment.courseId]!.price);
    }
  });

  it('has a free preview lesson and a test in every published course', () => {
    for (const course of published) {
      const lessons = values(db.lessons).filter((lesson) => lesson.courseId === course.id);
      expect(
        lessons.some((lesson) => lesson.isPreview),
        course.id,
      ).toBe(true);
      expect(
        values(db.quizzes).some((quiz) => quiz.courseId === course.id),
        course.id,
      ).toBe(true);
    }
  });

  it('contains the demo accounts', () => {
    expect(db.users[DEMO_STUDENT_ID]?.role).toBe('student');
    expect(db.users[DEMO_TEACHER_ID]?.role).toBe('teacher');
    expect(db.users[DEMO_OWNER_ID]?.isOwner).toBe(true);
  });

  it('records sales for the demo teacher so the statistics are meaningful', () => {
    const sales = values(db.enrollments).filter(
      (item) => item.teacherId === DEMO_TEACHER_ID && item.amount > 0,
    );
    expect(sales.length).toBeGreaterThan(20);
    for (const sale of sales) {
      expect(Date.parse(sale.createdAt)).toBeLessThanOrEqual(TEST_NOW.getTime());
    }
  });

  it('is deterministic for the same clock', () => {
    expect(buildSeed(TEST_NOW)).toEqual(db);
  });
});
