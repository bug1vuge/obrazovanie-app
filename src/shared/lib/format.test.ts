import { describe, expect, it } from 'vitest';
import {
  formatDuration,
  formatMoney,
  formatPrice,
  initials,
  plural,
  pluralize,
  WORDS,
} from './format';

const normalizeSpaces = (value: string) => value.replace(/\s/g, ' ');

describe('format', () => {
  it('formats prices and shows free courses as «Бесплатно»', () => {
    expect(formatPrice(0)).toBe('Бесплатно');
    expect(formatPrice(-5)).toBe('Бесплатно');
    expect(normalizeSpaces(formatPrice(2490))).toBe('2 490 ₽');
    expect(normalizeSpaces(formatMoney(0))).toBe('0 ₽');
  });

  it('formats durations', () => {
    expect(formatDuration(0)).toBe('—');
    expect(formatDuration(45)).toBe('45 мин');
    expect(formatDuration(120)).toBe('2 ч');
    expect(formatDuration(126)).toBe('2 ч 6 мин');
  });

  it.each([
    [1, 'урок'],
    [2, 'урока'],
    [4, 'урока'],
    [5, 'уроков'],
    [11, 'уроков'],
    [14, 'уроков'],
    [21, 'урок'],
    [22, 'урока'],
    [111, 'уроков'],
    [0, 'уроков'],
  ])('pluralises %i → %s', (count, word) => {
    expect(plural(count, WORDS.lesson)).toBe(word);
  });

  it('prefixes the count', () => {
    expect(pluralize(3, WORDS.module)).toBe('3 модуля');
  });

  it('builds initials', () => {
    expect(initials('Анна Ковалёва')).toBe('АК');
    expect(initials('  ')).toBe('?');
  });
});
