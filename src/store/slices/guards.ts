import { canEditCourse } from '@/entities/course/permissions';
import type { Course, User } from '@/entities/types';
import { DomainError } from '../errors';
import type { AppState } from '../types';

export function requireUser(state: AppState): User {
  const userId = state.session.userId;
  const user = userId ? state.db.users[userId] : undefined;
  if (!user) throw new DomainError('Сначала войдите в аккаунт');
  return user;
}

export function requireCourse(state: AppState, courseId: string): Course {
  const course = state.db.courses[courseId];
  if (!course) throw new DomainError('Курс не найден');
  return course;
}

/** Current user must be the author of the course (or the platform owner). */
export function requireEditableCourse(state: AppState, courseId: string): Course {
  const user = requireUser(state);
  const course = requireCourse(state, courseId);
  if (!canEditCourse(course, user))
    throw new DomainError('Этот курс принадлежит другому преподавателю');
  return course;
}

export function requireOwner(state: AppState): User {
  const user = requireUser(state);
  if (!user.isOwner) throw new DomainError('Доступно только администратору платформы');
  return user;
}
