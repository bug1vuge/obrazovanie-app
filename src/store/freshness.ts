import type { Database } from '@/entities/types';
import { values } from './table';

/** Demo data older than this is regenerated so charts always show recent months. */
export const DEMO_MAX_AGE_DAYS = 21;

/** True when the newest sale in the saved demo data is older than the limit. */
export function isDemoDataStale(db: Database, now: Date = new Date()): boolean {
  const newest = values(db.enrollments).reduce(
    (latest, item) => Math.max(latest, Date.parse(item.createdAt) || 0),
    0,
  );
  return now.getTime() - newest > DEMO_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
}
