import { Button } from '../Button';
import { Sheet } from './Sheet';

/** Action-sheet style confirmation for destructive or important actions. */
export function ConfirmSheet({
  open,
  title,
  message,
  confirmLabel,
  destructive = false,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <p className="text-[14.5px] leading-relaxed">{message}</p>
      <div className="mt-5 flex flex-col gap-2 pb-2">
        <Button
          size="lg"
          variant={destructive ? 'danger' : 'primary'}
          onClick={() => {
            onClose();
            onConfirm();
          }}
        >
          {confirmLabel}
        </Button>
        <Button size="lg" variant="soft" onClick={onClose}>
          Отмена
        </Button>
      </div>
    </Sheet>
  );
}
