import type { PromoCode } from '@/entities/types';

/** Composite key: one enrollment per user and course. */
export const enrollmentId = (userId: string, courseId: string) => `${userId}:${courseId}`;

/** Final price after a promo code; free courses stay free. */
export function applyPromo(price: number, promo: Pick<PromoCode, 'percent'> | null): number {
  const base = Math.max(0, Number(price) || 0);
  if (!promo || base === 0) return base;
  const percent = Math.min(100, Math.max(0, Number(promo.percent) || 0));
  return Math.max(0, Math.round(base * (1 - percent / 100)));
}

export const normalizePromoCode = (code: string) => code.trim().toUpperCase();
