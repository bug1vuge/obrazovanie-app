import { Check, RotateCcw, X } from 'lucide-react';
import { useState } from 'react';
import { optionLetter, PASS_THRESHOLD, type QuizAnswers } from '@/entities/quiz/lib';
import type { Quiz, QuizResult } from '@/entities/types';
import { cn } from '@/shared/lib/cn';
import { Badge, Button, ProgressBar } from '@/shared/ui';

interface QuizRunnerProps {
  quiz: Quiz;
  previous?: QuizResult;
  /** Grades and stores the attempt, returns the stored result. */
  onSubmit: (answers: QuizAnswers) => Pick<QuizResult, 'score' | 'passed' | 'correct' | 'total'>;
}

export function QuizRunner({ quiz, previous, onSubmit }: QuizRunnerProps) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<ReturnType<QuizRunnerProps['onSubmit']> | null>(null);
  const answered = Object.keys(answers).length;

  if (quiz.questions.length === 0) {
    return <p className="muted text-sm">В этом тесте пока нет вопросов.</p>;
  }

  const reset = () => {
    setAnswers({});
    setResult(null);
  };

  return (
    <div className="flex flex-col gap-4">
      {previous && !result && (
        <div className="soft-bg rounded-2xl px-4 py-3 text-[13px]">
          Предыдущая попытка: {previous.score}% —{' '}
          {previous.passed ? 'тест сдан' : `нужно ${PASS_THRESHOLD}% для зачёта`}
        </div>
      )}

      {result && (
        <div
          role="status"
          className={cn(
            'rounded-2xl px-4 py-4',
            result.passed ? 'bg-emerald-500/[0.12]' : 'bg-amber-500/[0.14]',
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <p className="font-display text-[17px]">
              {result.passed ? 'Тест сдан' : 'Почти получилось'}
            </p>
            <Badge tone={result.passed ? 'ok' : 'warn'}>
              {result.correct} / {result.total} · {result.score}%
            </Badge>
          </div>
          <ProgressBar value={result.score} className="mt-3" thin label="Результат теста" />
          <p className="muted mt-2 text-[12.5px]">
            {result.passed
              ? 'Результат сохранён в вашем прогрессе.'
              : `Для зачёта нужно ${PASS_THRESHOLD}% верных ответов. Можно попробовать снова.`}
          </p>
          <Button variant="soft" size="sm" className="mt-3" onClick={reset}>
            <RotateCcw size={14} aria-hidden /> Пройти заново
          </Button>
        </div>
      )}

      {quiz.questions.map((question, questionIndex) => {
        const picked = answers[questionIndex];
        return (
          <fieldset key={question.id} className="card p-4">
            <legend className="sr-only">Вопрос {questionIndex + 1}</legend>
            <p className="text-[14.5px] font-medium leading-snug">
              {questionIndex + 1}. {question.prompt}
            </p>
            <div className="mt-3 flex flex-col gap-2">
              {question.options.map((option, optionIndex) => {
                const selected = picked === optionIndex;
                const isRight = Boolean(result) && question.correct === optionIndex;
                const isWrong = Boolean(result) && selected && question.correct !== optionIndex;
                return (
                  <button
                    key={optionIndex}
                    type="button"
                    disabled={Boolean(result)}
                    aria-pressed={selected}
                    onClick={() =>
                      setAnswers((current) => ({ ...current, [questionIndex]: optionIndex }))
                    }
                    className={cn(
                      'flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left text-[13.5px] transition',
                      isRight
                        ? 'border-emerald-500/50 bg-emerald-500/10'
                        : isWrong
                          ? 'border-red-400/50 bg-red-500/10'
                          : selected
                            ? 'border-[rgb(var(--color-primary)/0.55)] bg-primary/10'
                            : 'bd hover-line',
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px]',
                        selected || isRight ? 'on-primary border-transparent bg-primary' : 'bd',
                      )}
                      aria-hidden
                    >
                      {isRight ? (
                        <Check size={12} />
                      ) : isWrong ? (
                        <X size={12} />
                      ) : (
                        optionLetter(optionIndex)
                      )}
                    </span>
                    {option}
                  </button>
                );
              })}
            </div>
            {result && question.explain && (
              <p className="muted mt-2 text-[12.5px] leading-snug">{question.explain}</p>
            )}
          </fieldset>
        );
      })}

      {!result && (
        <div className="flex items-center justify-between gap-3">
          <span className="muted text-[12.5px]">
            Отвечено {answered} из {quiz.questions.length}
          </span>
          <Button onClick={() => setResult(onSubmit(answers))} disabled={answered === 0}>
            Проверить ответы
          </Button>
        </div>
      )}
    </div>
  );
}
