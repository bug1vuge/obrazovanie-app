import { describe, expect, it } from 'vitest';
import { buildSeed } from '@/data/seed';
import { getCourseStatsIndex } from '@/store/selectors';
import { values } from '@/store/table';
import { TEST_NOW } from '@/test/utils';
import {
  activeFilterCount,
  DEFAULT_FILTERS,
  EXAM_FILTER_OPTIONS,
  filterCourses,
  filtersFromParams,
  filtersToParams,
  SORT_OPTIONS,
} from './filterCourses';

const db = buildSeed(TEST_NOW);
const courses = values(db.courses);
const stats = getCourseStatsIndex(db);

describe('filterCourses', () => {
  it('shows only published courses, newest first', () => {
    const result = filterCourses(courses, DEFAULT_FILTERS);
    expect(result).toHaveLength(36);
    expect(result[0]?.id).toBe('sp-eng-students');
    expect(result.at(-1)?.id).toBe('k-rus');
  });

  it('filters by exam; courses for both exams match either', () => {
    const oge = filterCourses(courses, { ...DEFAULT_FILTERS, exam: 'oge' });
    expect(oge.length).toBeGreaterThan(0);
    expect(oge.every((course) => course.exam === 'oge' || course.exam === 'both')).toBe(true);
    const ege = filterCourses(courses, { ...DEFAULT_FILTERS, exam: 'ege' });
    expect(ege.every((course) => course.exam === 'ege' || course.exam === 'both')).toBe(true);
    expect(ege.some((course) => course.id === 'sp-geo-oge-expert')).toBe(false);
  });

  it('filters by subject and search query', () => {
    const geo = filterCourses(courses, { ...DEFAULT_FILTERS, subject: 'География' });
    expect(geo.map((course) => course.id).sort()).toEqual([
      'sp-geo-ege-expert',
      'sp-geo-oge-expert',
      'sp-geo-students',
    ]);
    const search = filterCourses(courses, { ...DEFAULT_FILTERS, query: '  КОВАЛЁВА ' });
    expect(search.map((course) => course.teacherName)).toEqual(
      expect.arrayContaining(['Анна Ковалёва', 'Ника Ковалёва']),
    );
  });

  it('sorts by rating', () => {
    const result = filterCourses(courses, { ...DEFAULT_FILTERS, sort: 'rating' }, stats);
    const ratings = result.map((course) => stats[course.id]?.rating ?? 0);
    expect(ratings).toEqual([...ratings].sort((a, b) => b - a));
  });

  it('exposes no price filter and no «Популярные» sort', () => {
    expect(SORT_OPTIONS.map((option) => option.label)).not.toContain('Популярные');
    expect(EXAM_FILTER_OPTIONS.map((option) => option.id)).toEqual(['all', 'oge', 'ege']);
    expect(Object.keys(DEFAULT_FILTERS)).not.toContain('price');
  });

  it('counts active filters', () => {
    expect(activeFilterCount(DEFAULT_FILTERS)).toBe(0);
    expect(activeFilterCount({ ...DEFAULT_FILTERS, exam: 'ege', subject: 'Химия' })).toBe(2);
  });
});

describe('filters in the URL', () => {
  it('round-trips through search params and ignores invalid values', () => {
    const filters = { query: 'физика', subject: 'Физика', exam: 'ege', sort: 'rating' } as const;
    expect(filtersFromParams(filtersToParams(filters))).toEqual(filters);
    expect(filtersToParams(DEFAULT_FILTERS).toString()).toBe('');
    expect(filtersFromParams(new URLSearchParams('exam=gia&sort=price'))).toEqual(DEFAULT_FILTERS);
  });
});
