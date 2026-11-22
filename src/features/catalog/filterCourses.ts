import { matchesExam } from '@/entities/course/lib';
import type { Course, ExamType } from '@/entities/types';
import type { CourseStats } from '@/store/selectors';

export type CatalogSort = 'new' | 'rating';

export const SORT_OPTIONS: readonly { id: CatalogSort; label: string }[] = [
  { id: 'new', label: 'Новые' },
  { id: 'rating', label: 'По рейтингу' },
];

export const EXAM_FILTER_OPTIONS: readonly { id: ExamType | 'all'; label: string }[] = [
  { id: 'all', label: 'ОГЭ и ЕГЭ' },
  { id: 'oge', label: 'ОГЭ' },
  { id: 'ege', label: 'ЕГЭ' },
];

export interface CatalogFilters {
  query: string;
  subject: string | 'all';
  exam: ExamType | 'all';
  sort: CatalogSort;
}

export const DEFAULT_FILTERS: CatalogFilters = {
  query: '',
  subject: 'all',
  exam: 'all',
  sort: 'new',
};

/** Number of narrowing filters applied (search and sort are not counted). */
export const activeFilterCount = (filters: CatalogFilters) =>
  (filters.subject !== 'all' ? 1 : 0) + (filters.exam !== 'all' ? 1 : 0);

export function filterCourses(
  courses: readonly Course[],
  filters: CatalogFilters,
  stats: Readonly<Record<string, CourseStats>> = {},
): Course[] {
  const query = filters.query.trim().toLowerCase();
  const result = courses.filter((course) => {
    if (course.status !== 'published') return false;
    if (filters.subject !== 'all' && course.category !== filters.subject) return false;
    if (filters.exam !== 'all' && !matchesExam(course, filters.exam)) return false;
    if (!query) return true;
    const haystack =
      `${course.title} ${course.subtitle} ${course.teacherName} ${course.category}`.toLowerCase();
    return haystack.includes(query);
  });

  return result.sort((a, b) => {
    if (filters.sort === 'rating') {
      const diff = (stats[b.id]?.rating ?? 0) - (stats[a.id]?.rating ?? 0);
      if (diff !== 0) return diff;
    }
    return b.createdAt.localeCompare(a.createdAt);
  });
}

const isExam = (value: string | null): value is ExamType => value === 'oge' || value === 'ege';
const isSort = (value: string | null): value is CatalogSort =>
  SORT_OPTIONS.some((option) => option.id === value);

/** Filters live in the URL so they survive navigation to a course and back. */
export function filtersFromParams(params: URLSearchParams): CatalogFilters {
  const exam = params.get('exam');
  const sort = params.get('sort');
  return {
    query: params.get('q') ?? '',
    subject: params.get('subject') || 'all',
    exam: isExam(exam) ? exam : 'all',
    sort: isSort(sort) ? sort : DEFAULT_FILTERS.sort,
  };
}

export function filtersToParams(filters: CatalogFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.query) params.set('q', filters.query);
  if (filters.subject !== 'all') params.set('subject', filters.subject);
  if (filters.exam !== 'all') params.set('exam', filters.exam);
  if (filters.sort !== DEFAULT_FILTERS.sort) params.set('sort', filters.sort);
  return params;
}
