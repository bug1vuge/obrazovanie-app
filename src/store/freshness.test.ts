import { describe, expect, it } from 'vitest';
import { buildSeed } from '@/data/seed';
import { isDemoDataStale } from './freshness';

describe('isDemoDataStale', () => {
  const seededAt = new Date('2026-11-20T12:00:00.000Z');
  const db = buildSeed(seededAt);

  it('keeps fresh demo data', () => {
    expect(isDemoDataStale(db, seededAt)).toBe(false);
    expect(isDemoDataStale(db, new Date('2026-12-01T12:00:00.000Z'))).toBe(false);
  });

  it('regenerates demo data that is weeks old', () => {
    expect(isDemoDataStale(db, new Date('2027-01-20T12:00:00.000Z'))).toBe(true);
  });
});
