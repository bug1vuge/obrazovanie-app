import { describe, expect, it } from 'vitest';
import { buildSeed, DEMO_STUDENT_ID, DEMO_TEACHER_ID } from '@/data/seed';
import { TEST_NOW } from '@/test/utils';
import {
  getCourseMetricsIndex,
  getCourseOutline,
  getPlatformStats,
  getSubjectNames,
  getTeacherStats,
  getUserLearning,
  PLATFORM_FEE,
} from './selectors';
import { values } from './table';

const db = buildSeed(TEST_NOW);

describe('selectors', () => {
  it('builds the outline in learning order', () => {
    const outline = getCourseOutline(db, 'k-math');
    expect(outline.metrics).toEqual({ modulesCount: 2, lessonsCount: 6, totalMinutes: 126 });
    expect(outline.lessons[0]?.title).toBe('Как устроен профильный экзамен');
    expect(Object.keys(outline.quizByModule)).toHaveLength(2);
  });

  it('computes metrics for every course', () => {
    const metrics = getCourseMetricsIndex(db);
    expect(metrics['sp-geo-ege-expert']).toEqual({
      modulesCount: 2,
      lessonsCount: 4,
      totalMinutes: 58,
    });
  });

  it('reports the demo student learning progress', () => {
    const items = getUserLearning(db, DEMO_STUDENT_ID);
    const math = items.find((item) => item.enrollment.courseId === 'k-math');
    expect(math).toMatchObject({ completed: 3, total: 6, percent: 50, quizzesPassed: 1 });
    expect(math?.nextLessonId).toBe('k-math-l4');
    const finished = items.find((item) => item.enrollment.courseId === 'sp-inf-students');
    expect(finished?.percent).toBe(100);
    expect(getUserLearning(db, null)).toEqual([]);
  });

  it('sums teacher revenue only from paid sales of own courses', () => {
    const stats = getTeacherStats(db, DEMO_TEACHER_ID, TEST_NOW);
    const paid = values(db.enrollments).filter(
      (item) => item.teacherId === DEMO_TEACHER_ID && item.amount > 0,
    );
    expect(stats.sales).toBe(paid.length);
    expect(stats.revenue).toBe(paid.reduce((sum, item) => sum + item.amount, 0));
    expect(stats.averageCheck).toBe(Math.round(stats.revenue / stats.sales));
    expect(stats.byMonth).toHaveLength(6);
    expect(stats.byMonth.at(-1)?.key).toBe('2026-11');
    const monthly = stats.byMonth.reduce((sum, item) => sum + item.revenue, 0);
    expect(monthly).toBeLessThanOrEqual(stats.revenue);
    expect(stats.byCourse.reduce((sum, item) => sum + item.revenue, 0)).toBe(stats.revenue);
    expect(stats.recent.length).toBeLessThanOrEqual(8);
    expect(stats.revenuePrevMonthToDate).toBeLessThanOrEqual(stats.byMonth.at(-2)!.revenue);
    expect(PLATFORM_FEE).toBeGreaterThan(0);
  });

  it('returns zeros for a teacher without sales', () => {
    const stats = getTeacherStats(db, 'nobody', TEST_NOW);
    expect(stats).toMatchObject({ revenue: 0, sales: 0, students: 0, averageCheck: 0, rating: 0 });
  });

  it('summarises the platform', () => {
    const stats = getPlatformStats(db);
    expect(stats.courses).toBe(37);
    expect(stats.bySubject.reduce((sum, item) => sum + item.count, 0)).toBe(37);
  });

  it('lists subjects in admin order, only those with published courses', () => {
    const names = getSubjectNames(db);
    expect(names[0]).toBe('Русский язык');
    expect(names).toHaveLength(12);
  });
});

describe('learning after a course is deleted', () => {
  it('drops enrollments of removed courses from the learning list', () => {
    const copy = buildSeed(TEST_NOW);
    delete copy.courses['k-math'];
    const ids = getUserLearning(copy, DEMO_STUDENT_ID).map((item) => item.enrollment.courseId);
    expect(ids).not.toContain('k-math');
    expect(ids.length).toBeGreaterThan(0);
  });
});
