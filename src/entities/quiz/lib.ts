import type { Quiz, QuizQuestion } from '@/entities/types';

/** Minimal share of correct answers (in %) to pass a module test. */
export const PASS_THRESHOLD = 70;

/** Selected option index per question index. */
export type QuizAnswers = Readonly<Record<number, number>>;

export interface QuizGrade {
  score: number;
  passed: boolean;
  correct: number;
  total: number;
}

export function gradeQuiz(quiz: Pick<Quiz, 'questions'>, answers: QuizAnswers): QuizGrade {
  const total = quiz.questions.length;
  const correct = quiz.questions.reduce(
    (sum, question, index) => sum + (answers[index] === question.correct ? 1 : 0),
    0,
  );
  const score = total ? Math.round((correct / total) * 100) : 0;
  return { score, passed: total > 0 && score >= PASS_THRESHOLD, correct, total };
}

/** Drops empty questions/options and keeps the correct index pointing at the same text. */
export function sanitizeQuestions(questions: readonly QuizQuestion[]): QuizQuestion[] {
  return questions
    .filter((question) => question.prompt.trim())
    .map((question) => {
      const kept = question.options
        .map((text, index) => ({ text: text.trim(), index }))
        .filter((option) => option.text);
      const correct = Math.max(
        0,
        kept.findIndex((option) => option.index === question.correct),
      );
      return {
        ...question,
        prompt: question.prompt.trim(),
        explain: question.explain.trim(),
        options: kept.map((option) => option.text),
        correct,
      };
    })
    .filter((question) => question.options.length >= 2);
}

export const optionLetter = (index: number) => String.fromCharCode(65 + index);
