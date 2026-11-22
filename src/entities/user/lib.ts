import type { User } from '@/entities/types';

export const ROLE_LABELS: Record<User['role'], string> = {
  student: 'Ученик',
  teacher: 'Преподаватель',
};

export const displayName = (user: Pick<User, 'displayName' | 'email'> | null | undefined) =>
  (user?.displayName || user?.email.split('@')[0] || 'Ученик').trim();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const isValidEmail = (email: string) => EMAIL_RE.test(email.trim());
