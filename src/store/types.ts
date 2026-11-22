import type { StateCreator } from 'zustand';
import type { AdminSlice } from './slices/adminSlice';
import type { AuthSlice } from './slices/authSlice';
import type { LearningSlice } from './slices/learningSlice';
import type { StudioSlice } from './slices/studioSlice';
import type { Database, ID } from '@/entities/types';

export interface CoreSlice {
  db: Database;
  session: { userId: ID | null };
  /** Restores the demo database (keeps nothing from the visitor's actions). */
  resetDemo: () => void;
}

export type AppState = CoreSlice & AuthSlice & LearningSlice & StudioSlice & AdminSlice;

export type SliceCreator<T> = StateCreator<AppState, [], [], T>;

/** Clock is injectable so tests get stable timestamps. */
export interface StoreDeps {
  now: () => Date;
  seed: () => Database;
}
