import { useId, type ReactElement } from 'react';
import { cloneElement, isValidElement } from 'react';

/** Label + control + hint. Wires `id`/`aria-describedby` to the child control. */
export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactElement<{ id?: string; 'aria-describedby'?: string }>;
}) {
  const id = useId();
  const hintId = `${id}-hint`;
  const control = isValidElement(children)
    ? cloneElement(children, {
        id: children.props.id ?? id,
        'aria-describedby': hint ? hintId : undefined,
      })
    : children;
  return (
    <div className="block">
      <label
        htmlFor={children.props.id ?? id}
        className="muted mb-1.5 block text-[12.5px] font-medium uppercase tracking-wide"
      >
        {label}
      </label>
      {control}
      {hint && (
        <span id={hintId} className="muted mt-1 block text-xs">
          {hint}
        </span>
      )}
    </div>
  );
}
