import { useState } from 'react';
import type { Review } from '@/entities/types';
import { Button, Field, Notice, Stars } from '@/shared/ui';
import { Sheet } from '@/shared/ui/native';
import { useAppStore } from '@/store/appStore';
import { errorMessage } from '@/store/errors';

export function ReviewSheet({
  courseId,
  existing = null,
  open,
  onClose,
}: {
  courseId: string;
  /** The current user's review, if they already left one — the form edits it. */
  existing?: Review | null;
  open: boolean;
  onClose: () => void;
}) {
  const saveReview = useAppStore((state) => state.saveReview);
  const [rating, setRating] = useState(existing?.rating ?? 5);
  const [text, setText] = useState(existing?.text ?? '');
  const [error, setError] = useState('');
  const [wasOpen, setWasOpen] = useState(open);

  // Every time the form opens it starts from the saved review (or a blank one).
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setRating(existing?.rating ?? 5);
      setText(existing?.text ?? '');
      setError('');
    }
  }

  const submit = () => {
    try {
      saveReview(courseId, { rating, text });
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={existing ? 'Изменить отзыв' : 'Ваш отзыв о курсе'}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Отмена
          </Button>
          <Button onClick={submit}>{existing ? 'Сохранить' : 'Отправить'}</Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <div>
          <p className="muted mb-1.5 text-[12.5px] font-medium uppercase tracking-wide">Оценка</p>
          <Stars value={rating} onPick={setRating} size={18} />
        </div>
        <Field label="Что понравилось">
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={5}
            className="inp"
            placeholder="Пара предложений о курсе"
          />
        </Field>
        {error && <Notice tone="error">{error}</Notice>}
      </div>
    </Sheet>
  );
}
