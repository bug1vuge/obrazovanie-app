import { create, type StateCreator, type StoreApi, type UseBoundStore } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { buildSeed } from '@/data/seed';
import { createAdminSlice } from './slices/adminSlice';
import { createAuthSlice } from './slices/authSlice';
import { createLearningSlice } from './slices/learningSlice';
import { createStudioSlice } from './slices/studioSlice';
import type { AppState, StoreDeps } from './types';

/** Bump when the shape of persisted data or the demo seed changes. */
export const SCHEMA_VERSION = 1;
export const STORAGE_KEY = 'studypro-app-db';

const defaultDeps: StoreDeps = {
  now: () => new Date(),
  seed: () => buildSeed(),
};

function stateCreator(deps: StoreDeps): StateCreator<AppState> {
  return (set, get, api) => ({
    db: deps.seed(),
    session: { userId: null },
    resetDemo: () => set({ db: deps.seed(), session: { userId: null } }),
    ...createAuthSlice(deps)(set, get, api),
    ...createLearningSlice(deps)(set, get, api),
    ...createStudioSlice(deps)(set, get, api),
    ...createAdminSlice(deps)(set, get, api),
  });
}

export type AppStore = UseBoundStore<StoreApi<AppState>>;

/** In-memory store, used by tests. */
export function createAppStore(deps: Partial<StoreDeps> = {}): AppStore {
  return create<AppState>()(stateCreator({ ...defaultDeps, ...deps }));
}

/**
 * The application store. The demo database lives in localStorage so that
 * the clickable prototype remembers enrollments, progress and edits.
 */
export const useAppStore: AppStore = create<AppState>()(
  persist(stateCreator(defaultDeps) as StateCreator<AppState, [['zustand/persist', unknown]]>, {
    name: STORAGE_KEY,
    version: SCHEMA_VERSION,
    storage: createJSONStorage(() => localStorage),
    partialize: (state) => ({ db: state.db, session: state.session }),
    // Any older snapshot is replaced by a fresh seed instead of being migrated:
    // it is demo data, consistency matters more than preserving it.
    migrate: () => ({ db: buildSeed(), session: { userId: null } }),
  }),
);
