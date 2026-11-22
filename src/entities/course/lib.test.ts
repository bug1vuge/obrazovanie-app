import { describe, expect, it } from 'vitest';
import { coverSources, matchesExam, pickFreeCover, unsplashUrl } from './lib';

describe('coverSources', () => {
  it('builds responsive variants for Unsplash covers', () => {
    const { src, srcSet } = coverSources(unsplashUrl('photo-1'));
    expect(src).toBe('https://images.unsplash.com/photo-1?auto=format&fit=crop&w=960&q=75');
    expect(srcSet?.split(', ')).toHaveLength(4);
    expect(srcSet).toContain('w=320&q=75 320w');
  });

  it('keeps custom covers untouched', () => {
    expect(coverSources('https://example.com/a.jpg')).toEqual({ src: 'https://example.com/a.jpg' });
  });
});

describe('course helpers', () => {
  it('matches courses for both exams with either exam', () => {
    expect(matchesExam({ exam: 'both' }, 'oge')).toBe(true);
    expect(matchesExam({ exam: 'ege' }, 'oge')).toBe(false);
  });

  it('hands out a spare cover not used yet', () => {
    const first = pickFreeCover([]);
    expect(first).toMatch(/^https:\/\/images\.unsplash\.com\//);
    expect(pickFreeCover([{ coverUrl: first }])).not.toBe(first);
  });
});
