/**
 * Domain model of the platform.
 *
 * Every entity is a plain serialisable object with a string `id`, so the same
 * shapes can later be returned by a real REST/GraphQL backend without changes
 * to the UI layer.
 */

export type ID = string;
/** ISO-8601 timestamp. */
export type ISODate = string;

export type ExamType = 'oge' | 'ege';
/** A course can target one exam or be suitable for both. */
export type CourseExam = ExamType | 'both';

export type CourseStatus = 'draft' | 'pending' | 'published' | 'rejected' | 'archived';
export type CourseFormat = 'expert' | 'students' | 'flagship';
export type ToneId = 'violet' | 'sunset' | 'mint' | 'ocean' | 'berry' | 'ink';
export type LessonType = 'video' | 'text' | 'pdf';
export type UserRole = 'student' | 'teacher';

export interface Course {
  id: ID;
  title: string;
  subtitle: string;
  description: string;
  /** Subject name, matches `Category.name`. */
  category: string;
  exam: CourseExam;
  format: CourseFormat;
  /** Price in roubles, 0 means free. */
  price: number;
  tone: ToneId;
  coverUrl: string;
  coverCredit: string;
  teacherId: ID;
  teacherName: string;
  teacherHeadline: string;
  teacherBio: string;
  status: CourseStatus;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface CourseModule {
  id: ID;
  courseId: ID;
  title: string;
  order: number;
}

export interface Lesson {
  id: ID;
  courseId: ID;
  moduleId: ID;
  title: string;
  type: LessonType;
  /** Duration in minutes. */
  duration: number;
  content: string;
  videoUrl: string;
  pdfUrl: string;
  isPreview: boolean;
  order: number;
}

export interface QuizQuestion {
  id: ID;
  prompt: string;
  options: string[];
  /** Index of the correct option. */
  correct: number;
  explain: string;
}

export interface Quiz {
  id: ID;
  courseId: ID;
  moduleId: ID;
  title: string;
  questions: QuizQuestion[];
}

export interface Review {
  id: ID;
  courseId: ID;
  teacherId: ID;
  userId: ID;
  userName: string;
  rating: number;
  text: string;
  createdAt: ISODate;
}

/** A purchase / free sign-up of a student for a course. */
export interface Enrollment {
  id: ID;
  userId: ID;
  userName: string;
  courseId: ID;
  courseTitle: string;
  teacherId: ID;
  /** Amount actually paid in roubles (after promo code). */
  amount: number;
  promoCode: string | null;
  createdAt: ISODate;
}

export interface LessonProgress {
  id: ID;
  userId: ID;
  courseId: ID;
  lessonId: ID;
  completed: boolean;
  completedAt: ISODate | null;
}

export interface QuizResult {
  id: ID;
  userId: ID;
  courseId: ID;
  quizId: ID;
  score: number;
  passed: boolean;
  correct: number;
  total: number;
  takenAt: ISODate;
}

export interface Certificate {
  id: ID;
  userId: ID;
  userName: string;
  courseId: ID;
  courseTitle: string;
  teacherName: string;
  issuedAt: ISODate;
}

export interface PromoCode {
  id: ID;
  code: string;
  percent: number;
  active: boolean;
}

export interface Category {
  id: ID;
  name: string;
  order: number;
}

export interface StudyGoal {
  exam: ExamType;
  courseId: ID | null;
}

export interface User {
  id: ID;
  email: string;
  displayName: string;
  role: UserRole;
  headline: string;
  bio: string;
  /** Platform owner — has access to the admin panel. */
  isOwner: boolean;
  since: ISODate;
  goal: StudyGoal | null;
}

export type Table<T extends { id: ID }> = Record<ID, T>;

export interface Database {
  users: Table<User>;
  courses: Table<Course>;
  modules: Table<CourseModule>;
  lessons: Table<Lesson>;
  quizzes: Table<Quiz>;
  reviews: Table<Review>;
  enrollments: Table<Enrollment>;
  lessonProgress: Table<LessonProgress>;
  quizResults: Table<QuizResult>;
  certificates: Table<Certificate>;
  promoCodes: Table<PromoCode>;
  categories: Table<Category>;
}
