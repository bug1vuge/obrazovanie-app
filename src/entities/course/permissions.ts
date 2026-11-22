import type { Course, User } from '@/entities/types';

/** Authors edit their own courses; the platform owner can edit any course. */
export function canEditCourse(
  course: Pick<Course, 'teacherId'> | undefined,
  user: Pick<User, 'id' | 'isOwner'> | null | undefined,
): boolean {
  return Boolean(course && user && (user.isOwner || course.teacherId === user.id));
}
