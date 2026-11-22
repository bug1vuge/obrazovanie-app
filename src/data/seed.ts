import { certificateNumber } from '@/entities/certificate/lib';
import { examLabel, unsplashUrl } from '@/entities/course/lib';
import { applyPromo, enrollmentId } from '@/entities/enrollment/lib';
import type {
  Category,
  Certificate,
  Course,
  CourseModule,
  Database,
  Enrollment,
  Lesson,
  LessonProgress,
  PromoCode,
  Quiz,
  QuizResult,
  Review,
  Table,
  User,
} from '@/entities/types';
import { createRandom, type Random } from '@/shared/lib/random';
import {
  COURSE_SPECS,
  DRAFT_COURSE_ID,
  type CourseSpec,
  type FlagshipCourseSpec,
  type TemplateCourseSpec,
} from './catalog';
import { BUYER_NAMES, REVIEW_TEXTS, KMATH_REVIEWS } from './people';
import { getSubject, SUBJECTS, type SubjectMeta } from './subjects';
import { getTeacher, TEACHERS, type TeacherSeed } from './teachers';

export const DEMO_STUDENT_ID = 'u-student';
export const DEMO_TEACHER_ID = 't-sokolova';
export const DEMO_OWNER_ID = 'u-owner';

const DAY = 24 * 60 * 60 * 1000;
const SALES_WINDOW_DAYS = 180;

const toTable = <T extends { id: string }>(items: readonly T[]): Table<T> =>
  Object.fromEntries(items.map((item) => [item.id, item]));

const lowerFirst = (text: string) => text.charAt(0).toLowerCase() + text.slice(1);

const iso = (time: number) => new Date(time).toISOString();

interface CourseBundle {
  course: Course;
  modules: CourseModule[];
  lessons: Lesson[];
  quizzes: Quiz[];
}

function lessonBody(summary: string, exam: string): string {
  return [
    summary,
    '',
    'План урока:',
    '1. Короткая теория — только то, что нужно для экзамена.',
    `2. Разбор типовых заданий ${exam} с пояснением каждого шага.`,
    '3. Частые ошибки и как их избежать.',
    '4. Задания для самопроверки — ответы в тесте модуля.',
    '',
    'Совет: после урока отметьте его пройденным — прогресс сохранится, и к материалу можно вернуться в любой момент.',
  ].join('\n');
}

function introLessonBody(subject: SubjectMeta, exam: string): string {
  return [
    `Этот урок — про то, как устроен экзамен по предмету «${subject.name}» (${exam}).`,
    '',
    subject.intro,
    '',
    'Как работать с курсом: пройдите урок, отметьте его как пройденный, в конце модуля пройдите тест. Зачёт — от 70% верных ответов, попыток сколько угодно.',
  ].join('\n');
}

function buildQuiz(courseId: string, moduleId: string, index: number, subject: SubjectMeta): Quiz {
  const questions = subject.questions.slice(index * 3, index * 3 + 3);
  return {
    id: `${courseId}-q${index + 1}`,
    courseId,
    moduleId,
    title: `Тест модуля ${index + 1}`,
    questions: questions.map((question, position) => ({
      ...question,
      id: `${courseId}-q${index + 1}-${position + 1}`,
    })),
  };
}

function baseCourse(
  spec: CourseSpec,
  subject: SubjectMeta,
  teacher: TeacherSeed,
  createdAt: string,
): Omit<Course, 'title' | 'subtitle' | 'description'> {
  return {
    id: spec.id,
    category: subject.name,
    exam: spec.exam,
    format: spec.format,
    price: spec.price,
    tone: subject.tone,
    coverUrl: unsplashUrl(spec.cover),
    coverCredit: 'Unsplash',
    teacherId: teacher.id,
    teacherName: teacher.name,
    teacherHeadline: teacher.headline,
    teacherBio: teacher.bio,
    status: 'published',
    createdAt,
    updatedAt: createdAt,
  };
}

function buildTemplateCourse(spec: TemplateCourseSpec, createdAt: string): CourseBundle {
  const subject = getSubject(spec.subject);
  const teacher = getTeacher(spec.teacherId);
  const isExpert = spec.format === 'expert';
  const exam = examLabel(spec.exam);

  const description = [
    subject.intro,
    isExpert
      ? `Курс построен под формат ${exam}: что проверяют, как считается балл и где чаще всего теряют очки.`
      : 'Курс подходит и для ЕГЭ, и для ОГЭ: разбираем формулировки обоих экзаменов и учимся узнавать одно и то же задание в разных обёртках.',
    isExpert
      ? `Курс ведёт ${teacher.name} — ${lowerFirst(teacher.headline)}.`
      : `Занятия ведёт ${teacher.name} — ${lowerFirst(teacher.headline)}. Разбор идёт в живом темпе: спрашивайте, где непонятно.`,
    'Внутри: два модуля, четыре урока и тест с автопроверкой после каждого модуля. Прогресс сохраняется, сертификат выдаётся после завершения.',
  ].join('\n\n');

  const course: Course = {
    ...baseCourse(spec, subject, teacher, createdAt),
    title: isExpert
      ? `${subject.name}: ${exam} с экспертом`
      : `${subject.name}: онлайн-занятия со студентом вуза`,
    subtitle: isExpert
      ? `Программа ${exam}: теория, разбор реальных заданий и тест с автопроверкой`
      : `Живые разборы со студентом вуза · задания ЕГЭ и ОГЭ`,
    description,
  };

  const modules: CourseModule[] = [
    {
      id: `${spec.id}-m1`,
      courseId: spec.id,
      title: 'Модуль 1. Теория и формат экзамена',
      order: 0,
    },
    {
      id: `${spec.id}-m2`,
      courseId: spec.id,
      title: 'Модуль 2. Практика и типовые ошибки',
      order: 1,
    },
  ];
  const [m1, m2] = modules as [CourseModule, CourseModule];
  const [topicA, topicB, topicC] = subject.topics;

  const lesson = (
    n: number,
    moduleId: string,
    title: string,
    duration: number,
    content: string,
    order: number,
  ): Lesson => ({
    id: `${spec.id}-l${n}`,
    courseId: spec.id,
    moduleId,
    title,
    type: 'text',
    duration,
    content,
    videoUrl: '',
    pdfUrl: '',
    isPreview: n === 1,
    order,
  });

  const lessons: Lesson[] = [
    lesson(
      1,
      m1.id,
      isExpert
        ? `Формат ${exam}: что проверяют и как считают баллы`
        : 'Формат экзамена: что проверяют и как считают баллы',
      12,
      introLessonBody(subject, exam),
      0,
    ),
    lesson(2, m1.id, topicA.title, 15, lessonBody(topicA.summary, exam), 1),
    lesson(3, m2.id, topicB.title, 15, lessonBody(topicB.summary, exam), 0),
    lesson(4, m2.id, topicC.title, 16, lessonBody(topicC.summary, exam), 1),
  ];

  const quizzes = [buildQuiz(spec.id, m1.id, 0, subject), buildQuiz(spec.id, m2.id, 1, subject)];
  return { course, modules, lessons, quizzes };
}

function buildFlagshipCourse(spec: FlagshipCourseSpec, createdAt: string): CourseBundle {
  const subject = getSubject(spec.subject);
  const teacher = getTeacher(spec.teacherId);
  const exam = examLabel(spec.exam);
  const course: Course = {
    ...baseCourse(spec, subject, teacher, createdAt),
    title: spec.title,
    subtitle: spec.subtitle,
    description: spec.description,
  };

  const modules: CourseModule[] = [];
  const lessons: Lesson[] = [];
  const quizzes: Quiz[] = [];
  let lessonNumber = 0;

  spec.modules.forEach((moduleSpec, moduleIndex) => {
    const moduleId = `${spec.id}-m${moduleIndex + 1}`;
    modules.push({ id: moduleId, courseId: spec.id, title: moduleSpec.title, order: moduleIndex });
    moduleSpec.lessons.forEach((lessonSpec, order) => {
      lessonNumber += 1;
      const isIntro = lessonNumber === 1;
      lessons.push({
        id: `${spec.id}-l${lessonNumber}`,
        courseId: spec.id,
        moduleId,
        title: lessonSpec.title,
        type: 'text',
        duration: lessonSpec.duration,
        content: isIntro ? introLessonBody(subject, exam) : lessonBody(lessonSpec.summary, exam),
        videoUrl: '',
        pdfUrl: '',
        isPreview: isIntro,
        order,
      });
    });
    quizzes.push(buildQuiz(spec.id, moduleId, moduleIndex, subject));
  });

  return { course, modules, lessons, quizzes };
}

function buildDraftCourse(createdAt: string): CourseBundle {
  const teacher = getTeacher('t-sokolova');
  const subject = getSubject('math-prof');
  const id = DRAFT_COURSE_ID;
  const course: Course = {
    id,
    title: 'Геометрия для ОГЭ: задачи с чертежом',
    subtitle: 'Площади, подобие и окружность — разбор заданий второй части',
    description:
      'Короткий интенсив по геометрии для девятиклассников: учимся строить чертёж, находить подобные треугольники и оформлять решение второй части.',
    category: 'Математика профильный уровень',
    exam: 'oge',
    format: 'expert',
    price: 1490,
    tone: subject.tone,
    coverUrl: unsplashUrl('photo-1605106702842-01a887a31122'),
    coverCredit: 'Unsplash',
    teacherId: teacher.id,
    teacherName: teacher.name,
    teacherHeadline: teacher.headline,
    teacherBio: teacher.bio,
    status: 'pending',
    createdAt,
    updatedAt: createdAt,
  };
  const moduleId = `${id}-m1`;
  return {
    course,
    modules: [{ id: moduleId, courseId: id, title: 'Модуль 1. Планиметрия', order: 0 }],
    lessons: [
      {
        id: `${id}-l1`,
        courseId: id,
        moduleId,
        title: 'Подобие треугольников',
        type: 'text',
        duration: 18,
        content: lessonBody('Признаки подобия и задачи, где подобие спрятано в чертеже.', 'ОГЭ'),
        videoUrl: '',
        pdfUrl: '',
        isPreview: true,
        order: 0,
      },
      {
        id: `${id}-l2`,
        courseId: id,
        moduleId,
        title: 'Вписанные и центральные углы',
        type: 'text',
        duration: 20,
        content: lessonBody('Свойства углов в окружности и типовые задачи второй части.', 'ОГЭ'),
        videoUrl: '',
        pdfUrl: '',
        isPreview: false,
        order: 1,
      },
    ],
    quizzes: [buildQuiz(id, moduleId, 1, subject)],
  };
}

function buildUsers(now: number): User[] {
  const since = iso(now - 400 * DAY);
  const teachers: User[] = TEACHERS.map((teacher) => ({
    id: teacher.id,
    email: teacher.email,
    displayName: teacher.name,
    role: 'teacher',
    headline: teacher.headline,
    bio: teacher.bio,
    isOwner: false,
    since,
    goal: null,
  }));
  const demoStudent: User = {
    id: DEMO_STUDENT_ID,
    email: 'alisa@studypro.demo',
    displayName: 'Алиса Смирнова',
    role: 'student',
    headline: 'Ученица 11 класса',
    bio: '',
    isOwner: false,
    since: iso(now - 60 * DAY),
    goal: null,
  };
  const owner: User = {
    id: DEMO_OWNER_ID,
    email: 'admin@studypro.demo',
    displayName: 'Администратор',
    role: 'student',
    headline: 'Команда Study Pro',
    bio: '',
    isOwner: true,
    since: iso(now - 420 * DAY),
    goal: null,
  };
  const buyers: User[] = BUYER_NAMES.map((name, index) => ({
    id: `u-buyer-${index + 1}`,
    email: `student${index + 1}@studypro.demo`,
    displayName: name,
    role: 'student',
    headline: '',
    bio: '',
    isOwner: false,
    since: iso(now - (SALES_WINDOW_DAYS + 10) * DAY),
    goal: null,
  }));
  return [demoStudent, owner, ...teachers, ...buyers];
}

const PROMO_CODES: PromoCode[] = [
  { id: 'promo-ege2026', code: 'EGE2026', percent: 20, active: true },
  { id: 'promo-start10', code: 'START10', percent: 10, active: true },
  { id: 'promo-oge15', code: 'OGE15', percent: 15, active: true },
  { id: 'promo-summer', code: 'SUMMER50', percent: 50, active: false },
];

function salesCount(course: Course, random: Random): number {
  if (course.format === 'flagship') return random.int(28, 52);
  if (course.format === 'expert') return random.int(12, 30);
  return random.int(20, 42);
}

/** Days ago, skewed towards recent dates so revenue charts show growth. */
const recentDaysAgo = (random: Random) =>
  Math.floor(SALES_WINDOW_DAYS * Math.pow(random.next(), 1.5));

function buildSales(courses: Course[], buyers: User[], now: number, random: Random) {
  const enrollments: Enrollment[] = [];
  const reviews: Review[] = [];

  for (const course of courses) {
    if (course.status !== 'published') continue;
    const count = Math.min(salesCount(course, random), buyers.length);
    const pool = [...buyers];
    const courseEnrollments: Enrollment[] = [];
    for (let i = 0; i < count; i += 1) {
      const buyer = pool.splice(random.int(0, pool.length - 1), 1)[0] as User;
      const promo =
        course.price > 0 && random.chance(0.15)
          ? (random.pick(PROMO_CODES.filter((code) => code.active)) as PromoCode)
          : null;
      const createdAt = iso(now - recentDaysAgo(random) * DAY - random.int(0, DAY - 1));
      courseEnrollments.push({
        id: enrollmentId(buyer.id, course.id),
        userId: buyer.id,
        userName: buyer.displayName,
        courseId: course.id,
        courseTitle: course.title,
        teacherId: course.teacherId,
        amount: applyPromo(course.price, promo),
        promoCode: promo?.code ?? null,
        createdAt,
      });
    }
    enrollments.push(...courseEnrollments);

    const fixedTexts = course.id === 'k-math' ? KMATH_REVIEWS : null;
    const reviewCount = fixedTexts ? fixedTexts.length : random.int(0, 4);
    courseEnrollments.slice(0, reviewCount).forEach((enrollment, index) => {
      const fixed = fixedTexts?.[index];
      const reviewTime = Math.min(now, Date.parse(enrollment.createdAt) + random.int(3, 20) * DAY);
      reviews.push({
        id: `rev-${course.id}-${index + 1}`,
        courseId: course.id,
        teacherId: course.teacherId,
        userId: enrollment.userId,
        userName: fixed?.name ?? enrollment.userName.split(' ')[0] ?? enrollment.userName,
        rating: fixed?.rating ?? (random.chance(0.75) ? 5 : 4),
        text: fixed?.text ?? random.pick(REVIEW_TEXTS),
        createdAt: iso(reviewTime),
      });
    });
  }
  return { enrollments, reviews };
}

function buildDemoStudentActivity(bundles: Map<string, CourseBundle>, student: User, now: number) {
  const enrollments: Enrollment[] = [];
  const lessonProgress: LessonProgress[] = [];
  const quizResults: QuizResult[] = [];
  const certificates: Certificate[] = [];

  const plan: { courseId: string; daysAgo: number; lessonsDone: number; quizzesPassed: number }[] =
    [
      { courseId: 'k-math', daysAgo: 21, lessonsDone: 3, quizzesPassed: 1 },
      { courseId: 'sp-inf-students', daysAgo: 45, lessonsDone: 4, quizzesPassed: 2 },
      { courseId: 'sp-rus-students', daysAgo: 6, lessonsDone: 1, quizzesPassed: 0 },
    ];

  for (const item of plan) {
    const bundle = bundles.get(item.courseId);
    if (!bundle) continue;
    const { course, lessons, quizzes, modules } = bundle;
    const start = now - item.daysAgo * DAY;
    enrollments.push({
      id: enrollmentId(student.id, course.id),
      userId: student.id,
      userName: student.displayName,
      courseId: course.id,
      courseTitle: course.title,
      teacherId: course.teacherId,
      amount: course.price,
      promoCode: null,
      createdAt: iso(start),
    });

    const ordered = modules.flatMap((module) =>
      lessons.filter((lesson) => lesson.moduleId === module.id).sort((a, b) => a.order - b.order),
    );
    ordered.slice(0, item.lessonsDone).forEach((lesson, index) => {
      lessonProgress.push({
        id: `${student.id}:${lesson.id}`,
        userId: student.id,
        courseId: course.id,
        lessonId: lesson.id,
        completed: true,
        completedAt: iso(start + (index + 1) * DAY),
      });
    });
    quizzes.slice(0, item.quizzesPassed).forEach((quiz, index) => {
      quizResults.push({
        id: `${student.id}:${quiz.id}`,
        userId: student.id,
        courseId: course.id,
        quizId: quiz.id,
        score: 100,
        passed: true,
        correct: quiz.questions.length,
        total: quiz.questions.length,
        takenAt: iso(start + (index + 2) * DAY),
      });
    });
    if (item.lessonsDone >= lessons.length) {
      certificates.push({
        id: certificateNumber(student.id, course.id),
        userId: student.id,
        userName: student.displayName,
        courseId: course.id,
        courseTitle: course.title,
        teacherName: course.teacherName,
        issuedAt: iso(start + (lessons.length + 1) * DAY),
      });
    }
  }
  return { enrollments, lessonProgress, quizResults, certificates };
}

/**
 * Builds the full demo database. Pure and deterministic for a given `now`, so
 * tests can assert on exact figures.
 */
export function buildSeed(nowDate: Date = new Date()): Database {
  const now = nowDate.getTime();
  const random = createRandom(20260214);

  const bundles = new Map<string, CourseBundle>();
  COURSE_SPECS.forEach((spec, index) => {
    // Newest first in the spec order, all created before the sales window.
    const createdAt = iso(now - (SALES_WINDOW_DAYS + 20) * DAY - index * 60 * 60 * 1000);
    const bundle =
      spec.format === 'flagship'
        ? buildFlagshipCourse(spec, createdAt)
        : buildTemplateCourse(spec, createdAt);
    bundles.set(spec.id, bundle);
  });
  bundles.set(DRAFT_COURSE_ID, buildDraftCourse(iso(now - 3 * DAY)));

  const all = [...bundles.values()];
  const users = buildUsers(now);
  const buyers = users.filter((user) => user.id.startsWith('u-buyer-'));
  const student = users.find((user) => user.id === DEMO_STUDENT_ID) as User;

  const courses = all.map((bundle) => bundle.course);
  const sales = buildSales(courses, buyers, now, random);
  const demo = buildDemoStudentActivity(bundles, student, now);

  const categories: Category[] = SUBJECTS.map((subject, order) => ({
    id: `cat-${subject.code}`,
    name: subject.name,
    order,
  }));

  return {
    users: toTable(users),
    courses: toTable(courses),
    modules: toTable(all.flatMap((bundle) => bundle.modules)),
    lessons: toTable(all.flatMap((bundle) => bundle.lessons)),
    quizzes: toTable(all.flatMap((bundle) => bundle.quizzes)),
    reviews: toTable(sales.reviews),
    enrollments: toTable([...sales.enrollments, ...demo.enrollments]),
    lessonProgress: toTable(demo.lessonProgress),
    quizResults: toTable(demo.quizResults),
    certificates: toTable(demo.certificates),
    promoCodes: toTable(PROMO_CODES),
    categories: toTable(categories),
  };
}
