import type { ID, StudyGoal, User } from '@/entities/types';
import { isValidEmail } from '@/entities/user/lib';
import { createId } from '@/shared/lib/id';
import { DomainError } from '../errors';
import { patch, upsert, values } from '../table';
import type { SliceCreator, StoreDeps } from '../types';
import { requireUser } from './guards';

export type ProfilePatch = Partial<Pick<User, 'displayName' | 'headline' | 'bio' | 'role'>>;

export interface AuthSlice {
  /** Demo sign-in into an existing account. */
  signIn: (userId: ID) => void;
  /** Signs in by e-mail, creating a student account on first visit. */
  signInWithEmail: (input: { name: string; email: string }) => User;
  signOut: () => void;
  updateProfile: (changes: ProfilePatch) => void;
  setGoal: (goal: StudyGoal) => void;
}

export const createAuthSlice =
  (deps: StoreDeps): SliceCreator<AuthSlice> =>
  (set, get) => ({
    signIn: (userId) => {
      if (!get().db.users[userId]) throw new DomainError('Аккаунт не найден');
      set({ session: { userId } });
    },

    signInWithEmail: ({ name, email }) => {
      const normalized = email.trim().toLowerCase();
      if (!isValidEmail(normalized)) throw new DomainError('Введите корректный e-mail');
      const { db } = get();
      const existing = values(db.users).find((user) => user.email.toLowerCase() === normalized);
      if (existing) {
        set({ session: { userId: existing.id } });
        return existing;
      }
      const displayName = name.trim() || normalized.split('@')[0] || 'Ученик';
      const user: User = {
        id: createId('u'),
        email: normalized,
        displayName,
        role: 'student',
        headline: '',
        bio: '',
        isOwner: false,
        since: deps.now().toISOString(),
        goal: null,
      };
      set({ db: { ...db, users: upsert(db.users, user) }, session: { userId: user.id } });
      return user;
    },

    signOut: () => set({ session: { userId: null } }),

    updateProfile: (changes) => {
      const state = get();
      const user = requireUser(state);
      const next: ProfilePatch = { ...changes };
      if (next.displayName !== undefined) {
        next.displayName = next.displayName.trim() || user.displayName;
      }
      if (next.headline !== undefined) next.headline = next.headline.trim();
      if (next.bio !== undefined) next.bio = next.bio.trim();
      set({ db: { ...state.db, users: patch(state.db.users, user.id, next) } });
    },

    setGoal: (goal) => {
      const state = get();
      const user = requireUser(state);
      if (goal.courseId && !state.db.courses[goal.courseId]) {
        throw new DomainError('Курс не найден');
      }
      set({ db: { ...state.db, users: patch(state.db.users, user.id, { goal }) } });
    },
  });
