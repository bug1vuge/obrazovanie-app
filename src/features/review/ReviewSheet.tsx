import { useState } from 'react';
import { Button, Field, Notice, Stars } from '@/shared/ui';
import { Sheet } from '@/shared/ui/native';
import { useAppStore } from '@/store/appStore';
import { errorMessage } from '@/store/errors';

export function ReviewSheet({
  courseId,
  open,
  onClose,
}: {
  courseId: string;
  open: boolean;
  onClose: () => void;
}) {
  const saveReview = useAppStore((state) => state.saveReview);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  const submit = () => {
    try {
      saveReview(courseId, { rating, text });
      setText('');
      setRating(5);
      setError('');
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Ваш отзыв о курсе"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Отмена
          </Button>
          <Button onClick={submit}>Отправить</Button>
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
