const currencyFormatter = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
});

/** Price in roubles, `0` and invalid values render as «Бесплатно». */
export function formatPrice(value: number): string {
  const amount = Number(value) || 0;
  return amount <= 0 ? 'Бесплатно' : currencyFormatter.format(amount);
}

/** Money amount in roubles, `0` stays `0 ₽` (used in reports). */
export function formatMoney(value: number): string {
  return currencyFormatter.format(Math.round(Number(value) || 0));
}

/** Minutes → «45 мин», «2 ч», «1 ч 20 мин». */
export function formatDuration(minutes: number): string {
  const total = Math.round(Number(minutes) || 0);
  if (total <= 0) return '—';
  if (total < 60) return `${total} мин`;
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  return rest ? `${hours} ч ${rest} мин` : `${hours} ч`;
}

/** ISO date → «10 ноября 2026 г.» */
export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** ISO date → «10.11.2026» */
export function formatShortDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('ru-RU');
}

/**
 * Russian pluralisation: `plural(5, ['урок', 'урока', 'уроков'])` → «уроков».
 */
export function plural(count: number, forms: readonly [string, string, string]): string {
  const n = Math.abs(Math.trunc(count)) % 100;
  const last = n % 10;
  if (n > 10 && n < 20) return forms[2];
  if (last > 1 && last < 5) return forms[1];
  if (last === 1) return forms[0];
  return forms[2];
}

/** `pluralize(5, ['урок','урока','уроков'])` → «5 уроков». */
export function pluralize(count: number, forms: readonly [string, string, string]): string {
  return `${count} ${plural(count, forms)}`;
}

/** «Анна Ковалёва» → «АК». */
export function initials(name: string): string {
  const letters = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? '')
    .join('')
    .toUpperCase();
  return letters || '?';
}

export const WORDS = {
  lesson: ['урок', 'урока', 'уроков'],
  module: ['модуль', 'модуля', 'модулей'],
  student: ['студент', 'студента', 'студентов'],
  review: ['отзыв', 'отзыва', 'отзывов'],
  course: ['курс', 'курса', 'курсов'],
  question: ['вопрос', 'вопроса', 'вопросов'],
  sale: ['продажа', 'продажи', 'продаж'],
} as const satisfies Record<string, readonly [string, string, string]>;
