import { useMemo } from 'react';
import type { User } from '@/entities/types';
import { useAppStore } from './appStore';
import { getCourseMetricsIndex, getCourseStatsIndex } from './selectors';

export function useCurrentUser(): User | null {
  return useAppStore((state) =>
    state.session.userId ? (state.db.users[state.session.userId] ?? null) : null,
  );
}

export function useDb() {
  return useAppStore((state) => state.db);
}

/** Lesson counts/durations per course, recalculated only when lessons change. */
export function useCourseMetrics() {
  const modules = useAppStore((state) => state.db.modules);
  const lessons = useAppStore((state) => state.db.lessons);
  const courses = useAppStore((state) => state.db.courses);
  return useMemo(
    () => getCourseMetricsIndex({ modules, lessons, courses }),
    [modules, lessons, courses],
  );
}

/** Rating, review and student counts per course. */
export function useCourseStats() {
  const reviews = useAppStore((state) => state.db.reviews);
  const enrollments = useAppStore((state) => state.db.enrollments);
  const courses = useAppStore((state) => state.db.courses);
  return useMemo(
    () => getCourseStatsIndex({ reviews, enrollments, courses }),
    [reviews, enrollments, courses],
  );
}
