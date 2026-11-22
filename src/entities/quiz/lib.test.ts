import { describe, expect, it } from 'vitest';
import type { QuizQuestion } from '@/entities/types';
import { gradeQuiz, optionLetter, sanitizeQuestions } from './lib';

const question = (correct: number, id = 'q'): QuizQuestion => ({
  id,
  prompt: 'Вопрос',
  options: ['A', 'B', 'C'],
  correct,
  explain: '',
});

describe('gradeQuiz', () => {
  const quiz = { questions: [question(0), question(1), question(2)] };

  it('passes at 70% and above', () => {
    expect(gradeQuiz(quiz, { 0: 0, 1: 1, 2: 2 })).toEqual({
      score: 100,
      passed: true,
      correct: 3,
      total: 3,
    });
    expect(gradeQuiz(quiz, { 0: 0, 1: 1, 2: 0 })).toEqual({
      score: 67,
      passed: false,
      correct: 2,
      total: 3,
    });
  });

  it('treats unanswered questions as wrong', () => {
    expect(gradeQuiz(quiz, {}).score).toBe(0);
  });

  it('never passes an empty quiz', () => {
    expect(gradeQuiz({ questions: [] }, {}).passed).toBe(false);
  });
});

describe('sanitizeQuestions', () => {
  it('drops empty questions and options and keeps the correct answer', () => {
    const result = sanitizeQuestions([
      { id: '1', prompt: '  Что? ', options: ['', 'Да', '  ', 'Нет'], correct: 3, explain: ' ' },
      { id: '2', prompt: '', options: ['a', 'b'], correct: 0, explain: '' },
      { id: '3', prompt: 'Один вариант', options: ['a', ''], correct: 0, explain: '' },
    ]);
    expect(result).toEqual([
      { id: '1', prompt: 'Что?', options: ['Да', 'Нет'], correct: 1, explain: '' },
    ]);
  });
});

it('maps option index to a letter', () => {
  expect(optionLetter(0)).toBe('A');
  expect(optionLetter(3)).toBe('D');
});
