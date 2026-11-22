import type {
  Course,
  CourseExam,
  CourseStatus,
  ExamType,
  Lesson,
  LessonType,
  ToneId,
} from '@/entities/types';

export interface Tone {
  id: ToneId;
  from: string;
  to: string;
}

export const TONES: readonly Tone[] = [
  { id: 'violet', from: '#5b47d6', to: '#a855f7' },
  { id: 'sunset', from: '#f0663a', to: '#f7b23b' },
  { id: 'mint', from: '#0f766e', to: '#34d399' },
  { id: 'ocean', from: '#1d4ed8', to: '#38bdf8' },
  { id: 'berry', from: '#be185d', to: '#f472b6' },
  { id: 'ink', from: '#1f2937', to: '#525a68' },
];

export function getTone(id: string | undefined): Tone {
  return TONES.find((tone) => tone.id === id) ?? (TONES[0] as Tone);
}

export const EXAMS: readonly { id: ExamType; label: string; description: string }[] = [
  { id: 'oge', label: 'ОГЭ', description: '9 класс' },
  { id: 'ege', label: 'ЕГЭ', description: '11 класс' },
];

export const COURSE_EXAM_OPTIONS: readonly { id: CourseExam; label: string }[] = [
  { id: 'ege', label: 'ЕГЭ' },
  { id: 'oge', label: 'ОГЭ' },
  { id: 'both', label: 'ЕГЭ и ОГЭ' },
];

export function examLabel(exam: CourseExam): string {
  return COURSE_EXAM_OPTIONS.find((option) => option.id === exam)?.label ?? 'ЕГЭ и ОГЭ';
}

/** Whether a course prepares for the given exam (courses for both match either). */
export function matchesExam(course: Pick<Course, 'exam'>, exam: ExamType): boolean {
  return course.exam === exam || course.exam === 'both';
}

export const STATUS_LABELS: Record<CourseStatus, string> = {
  draft: 'Черновик',
  pending: 'На модерации',
  published: 'Опубликован',
  rejected: 'Отклонён',
  archived: 'Скрыт',
};

export type BadgeTone = 'neutral' | 'primary' | 'ok' | 'warn' | 'bad';

export const STATUS_TONES: Record<CourseStatus, BadgeTone> = {
  draft: 'neutral',
  pending: 'warn',
  published: 'ok',
  rejected: 'bad',
  archived: 'neutral',
};

export const LESSON_TYPES: readonly { id: LessonType; label: string }[] = [
  { id: 'video', label: 'Видео' },
  { id: 'text', label: 'Текст' },
  { id: 'pdf', label: 'PDF' },
];

export function isVisibleCourse(course: Course | undefined): course is Course {
  return Boolean(course) && course?.status !== 'archived';
}

const UNSPLASH = 'https://images.unsplash.com/';

/** Builds a sized CDN url for an Unsplash photo id like `photo-123-abc`. */
export function unsplashUrl(photoId: string, width = 1080): string {
  return `${UNSPLASH}${photoId}?auto=format&fit=crop&w=${width}&q=75`;
}

const UNSPLASH_WIDTHS = [320, 640, 960, 1280] as const;

/**
 * Responsive variants for Unsplash covers so phones download small images.
 * Other URLs (custom covers) are returned as is.
 */
export function coverSources(url: string): { src: string; srcSet?: string } {
  if (!url.startsWith(UNSPLASH)) return { src: url };
  const base = url.split('?')[0] ?? url;
  const variant = (width: number) => `${base}?auto=format&fit=crop&w=${width}&q=75`;
  return {
    src: variant(960),
    srcSet: UNSPLASH_WIDTHS.map((width) => `${variant(width)} ${width}w`).join(', '),
  };
}

/**
 * Spare covers handed out to courses created in the studio. Every course gets
 * its own photo, so cards in the catalog never repeat a picture.
 */
export const SPARE_COVERS: readonly string[] = [
  'photo-1434030216411-0b793f4b4173',
  'photo-1456406644174-8ddd4cd52a06',
  'photo-1560785496-3c9d27877182',
  'photo-1571260899304-425eee4c7efc',
  'photo-1513258496099-48168024aec0',
  'photo-1610116306796-6fea9f4fae38',
  'photo-1532012197267-da84d127e765',
  'photo-1535905557558-afc4877a26fc',
  'photo-1472173148041-00294f0814a2',
  'photo-1489421471208-251cc68284b8',
];

/** First spare cover not used by any existing course, or `''` when exhausted. */
export function pickFreeCover(courses: readonly Pick<Course, 'coverUrl'>[]): string {
  const used = new Set(courses.map((course) => course.coverUrl));
  const free = SPARE_COVERS.map((id) => unsplashUrl(id)).find((url) => !used.has(url));
  return free ?? '';
}

export interface CourseMetrics {
  modulesCount: number;
  lessonsCount: number;
  totalMinutes: number;
}

export function sortByOrder<T extends { order: number }>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => a.order - b.order);
}

export function sumDuration(lessons: readonly Pick<Lesson, 'duration'>[]): number {
  return lessons.reduce((total, lesson) => total + (Number(lesson.duration) || 0), 0);
}
