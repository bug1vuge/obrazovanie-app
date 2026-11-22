/**
 * Pure read-model functions over the database. They never mutate and are easy
 * to unit-test; React components call them through `useMemo`.
 */
import { enrollmentId } from '@/entities/enrollment/lib';
import { sortByOrder, sumDuration, type CourseMetrics } from '@/entities/course/lib';
import type {
  Course,
  CourseModule,
  Database,
  Enrollment,
  ID,
  Lesson,
  LessonProgress,
  Quiz,
  QuizResult,
} from '@/entities/types';
import { values } from './table';

export interface CourseOutline {
  modules: CourseModule[];
  /** Lessons in learning order: by module order, then lesson order. */
  lessons: Lesson[];
  lessonsByModule: Record<ID, Lesson[]>;
  quizByModule: Record<ID, Quiz>;
  metrics: CourseMetrics;
}

export function getCourseOutline(db: Database, courseId: ID): CourseOutline {
  const modules = sortByOrder(values(db.modules).filter((item) => item.courseId === courseId));
  const courseLessons = values(db.lessons).filter((item) => item.courseId === courseId);
  const lessonsByModule: Record<ID, Lesson[]> = {};
  for (const module of modules) {
    lessonsByModule[module.id] = sortByOrder(
      courseLessons.filter((lesson) => lesson.moduleId === module.id),
    );
  }
  const quizByModule: Record<ID, Quiz> = {};
  for (const quiz of values(db.quizzes)) {
    if (quiz.courseId === courseId) quizByModule[quiz.moduleId] = quiz;
  }
  const lessons = modules.flatMap((module) => lessonsByModule[module.id] ?? []);
  return {
    modules,
    lessons,
    lessonsByModule,
    quizByModule,
    metrics: {
      modulesCount: modules.length,
      lessonsCount: lessons.length,
      totalMinutes: sumDuration(lessons),
    },
  };
}

export function getCourseMetricsIndex(
  db: Pick<Database, 'courses' | 'modules' | 'lessons'>,
): Record<ID, CourseMetrics> {
  const index: Record<ID, CourseMetrics> = {};
  const ensure = (courseId: ID) =>
    (index[courseId] ??= { modulesCount: 0, lessonsCount: 0, totalMinutes: 0 });
  for (const course of values(db.courses)) ensure(course.id);
  for (const module of values(db.modules)) ensure(module.courseId).modulesCount += 1;
  for (const lesson of values(db.lessons)) {
    const metrics = ensure(lesson.courseId);
    metrics.lessonsCount += 1;
    metrics.totalMinutes += Number(lesson.duration) || 0;
  }
  return index;
}

export interface CourseStats {
  rating: number;
  reviews: number;
  students: number;
}

export function getCourseStatsIndex(
  db: Pick<Database, 'courses' | 'reviews' | 'enrollments'>,
): Record<ID, CourseStats> {
  const index: Record<ID, CourseStats> = {};
  const ratingSum: Record<ID, number> = {};
  const ensure = (courseId: ID) => (index[courseId] ??= { rating: 0, reviews: 0, students: 0 });
  for (const course of values(db.courses)) ensure(course.id);
  for (const review of values(db.reviews)) {
    ensure(review.courseId).reviews += 1;
    ratingSum[review.courseId] = (ratingSum[review.courseId] ?? 0) + review.rating;
  }
  for (const enrollment of values(db.enrollments)) ensure(enrollment.courseId).students += 1;
  for (const [courseId, stats] of Object.entries(index)) {
    stats.rating = stats.reviews ? (ratingSum[courseId] ?? 0) / stats.reviews : 0;
  }
  return index;
}

export const isEnrolled = (db: Database, userId: ID | null | undefined, courseId: ID) =>
  Boolean(userId && db.enrollments[enrollmentId(userId, courseId)]);

export function getLessonProgressIndex(db: Database, userId: ID | null | undefined) {
  const index: Record<ID, LessonProgress> = {};
  if (!userId) return index;
  for (const item of values(db.lessonProgress)) {
    if (item.userId === userId) index[item.lessonId] = item;
  }
  return index;
}

export function getQuizResultIndex(db: Database, userId: ID | null | undefined) {
  const index: Record<ID, QuizResult> = {};
  if (!userId) return index;
  for (const item of values(db.quizResults)) {
    if (item.userId === userId) index[item.quizId] = item;
  }
  return index;
}

export interface LearningItem {
  enrollment: Enrollment;
  course: Course | undefined;
  total: number;
  completed: number;
  percent: number;
  quizzesPassed: number;
  /** First not-completed lesson — where «Продолжить» leads. */
  nextLessonId: ID | null;
}

export function getUserLearning(db: Database, userId: ID | null | undefined): LearningItem[] {
  if (!userId) return [];
  const progress = getLessonProgressIndex(db, userId);
  const quizzes = getQuizResultIndex(db, userId);
  return (
    values(db.enrollments)
      // Courses removed by the administrator disappear from the learning list.
      .filter((enrollment) => enrollment.userId === userId && db.courses[enrollment.courseId])
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((enrollment) => {
        const outline = getCourseOutline(db, enrollment.courseId);
        const completed = outline.lessons.filter((lesson) => progress[lesson.id]?.completed).length;
        const total = outline.lessons.length;
        const next = outline.lessons.find((lesson) => !progress[lesson.id]?.completed);
        return {
          enrollment,
          course: db.courses[enrollment.courseId],
          total,
          completed,
          percent: total ? Math.round((completed / total) * 100) : 0,
          quizzesPassed: Object.values(outline.quizByModule).filter(
            (quiz) => quizzes[quiz.id]?.passed,
          ).length,
          nextLessonId: next?.id ?? null,
        };
      })
  );
}

export interface MonthlyRevenue {
  /** `YYYY-MM` */
  key: string;
  label: string;
  revenue: number;
  sales: number;
}

export interface CourseRevenue {
  courseId: ID;
  title: string;
  revenue: number;
  sales: number;
}

export interface TeacherStats {
  revenue: number;
  /** Paid enrollments only. */
  sales: number;
  students: number;
  averageCheck: number;
  rating: number;
  reviews: number;
  revenueThisMonth: number;
  /** Revenue of the previous month up to the same day — a fair comparison. */
  revenuePrevMonthToDate: number;
  byMonth: MonthlyRevenue[];
  byCourse: CourseRevenue[];
  recent: Enrollment[];
}

/** Platform commission withheld from teachers' revenue. */
export const PLATFORM_FEE = 0.15;

const monthKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const MONTH_LABELS = [
  'янв',
  'фев',
  'мар',
  'апр',
  'май',
  'июн',
  'июл',
  'авг',
  'сен',
  'окт',
  'ноя',
  'дек',
];

export function getTeacherStats(
  db: Database,
  teacherId: ID,
  now: Date = new Date(),
  months = 6,
): TeacherStats {
  const ownCourseIds = new Set(
    values(db.courses)
      .filter((course) => course.teacherId === teacherId)
      .map((course) => course.id),
  );
  const enrollments = values(db.enrollments)
    .filter((item) => item.teacherId === teacherId || ownCourseIds.has(item.courseId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const paid = enrollments.filter((item) => item.amount > 0);
  const revenue = paid.reduce((sum, item) => sum + item.amount, 0);

  const byMonth: MonthlyRevenue[] = [];
  for (let offset = months - 1; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    byMonth.push({
      key: monthKey(date),
      label: MONTH_LABELS[date.getMonth()] ?? '',
      revenue: 0,
      sales: 0,
    });
  }
  const monthIndex = new Map(byMonth.map((item) => [item.key, item]));
  for (const item of paid) {
    const bucket = monthIndex.get(monthKey(new Date(item.createdAt)));
    if (bucket) {
      bucket.revenue += item.amount;
      bucket.sales += 1;
    }
  }

  const courseIndex = new Map<ID, CourseRevenue>();
  for (const item of paid) {
    const entry = courseIndex.get(item.courseId) ?? {
      courseId: item.courseId,
      title: db.courses[item.courseId]?.title ?? item.courseTitle,
      revenue: 0,
      sales: 0,
    };
    entry.revenue += item.amount;
    entry.sales += 1;
    courseIndex.set(item.courseId, entry);
  }

  const dayOfMonth = now.getDate();
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const revenuePrevMonthToDate = paid
    .filter((item) => {
      const date = new Date(item.createdAt);
      return (
        date.getFullYear() === prevMonth.getFullYear() &&
        date.getMonth() === prevMonth.getMonth() &&
        date.getDate() <= dayOfMonth
      );
    })
    .reduce((sum, item) => sum + item.amount, 0);

  const reviews = values(db.reviews).filter(
    (review) => review.teacherId === teacherId || ownCourseIds.has(review.courseId),
  );

  return {
    revenue,
    sales: paid.length,
    students: new Set(enrollments.map((item) => item.userId)).size,
    averageCheck: paid.length ? Math.round(revenue / paid.length) : 0,
    rating: reviews.length
      ? reviews.reduce((sum, item) => sum + item.rating, 0) / reviews.length
      : 0,
    reviews: reviews.length,
    revenueThisMonth: byMonth.at(-1)?.revenue ?? 0,
    revenuePrevMonthToDate,
    byMonth,
    byCourse: [...courseIndex.values()].sort((a, b) => b.revenue - a.revenue),
    recent: paid.slice(0, 8),
  };
}

export interface PlatformStats {
  users: number;
  courses: number;
  enrollments: number;
  turnover: number;
  bySubject: { key: string; count: number }[];
}

export function getPlatformStats(db: Database): PlatformStats {
  const courses = values(db.courses).filter((course) => course.status !== 'archived');
  const subjects = new Map<string, number>();
  for (const course of courses) {
    const key = course.category || 'Без категории';
    subjects.set(key, (subjects.get(key) ?? 0) + 1);
  }
  const enrollments = values(db.enrollments);
  return {
    users: values(db.users).length,
    courses: courses.length,
    enrollments: enrollments.length,
    turnover: enrollments.reduce((sum, item) => sum + item.amount, 0),
    bySubject: [...subjects.entries()].map(([key, count]) => ({ key, count })),
  };
}

/** Subjects for filters: categories in admin order plus any used by courses. */
export function getSubjectNames(db: Database): string[] {
  const ordered = sortByOrder(values(db.categories)).map((category) => category.name);
  const used = new Set(
    values(db.courses)
      .filter((course) => course.status === 'published')
      .map((course) => course.category),
  );
  const extra = [...used].filter((name) => !ordered.includes(name));
  return [...ordered.filter((name) => used.has(name)), ...extra];
}
