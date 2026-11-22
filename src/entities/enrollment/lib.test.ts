import { describe, expect, it } from 'vitest';
import { applyPromo, normalizePromoCode } from './lib';

describe('applyPromo', () => {
  it('applies the discount and rounds to roubles', () => {
    expect(applyPromo(2490, { percent: 20 })).toBe(1992);
    expect(applyPromo(1990, { percent: 15 })).toBe(1692);
  });

  it('keeps free courses free and clamps the percent', () => {
    expect(applyPromo(0, { percent: 50 })).toBe(0);
    expect(applyPromo(1000, { percent: 150 })).toBe(0);
    expect(applyPromo(1000, { percent: -10 })).toBe(1000);
    expect(applyPromo(1000, null)).toBe(1000);
  });

  it('normalises codes', () => {
    expect(normalizePromoCode('  ege2026 ')).toBe('EGE2026');
  });
});
