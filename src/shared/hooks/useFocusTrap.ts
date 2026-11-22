import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Open traps, innermost last: only the top one reacts to keys. */
const stack: symbol[] = [];

/**
 * Keeps keyboard focus inside `ref` while active, closes on Escape and
 * returns focus to the previously focused element afterwards.
 */
export function useFocusTrap(
  ref: RefObject<HTMLElement | null>,
  active: boolean,
  onEscape?: () => void,
) {
  const escapeRef = useRef(onEscape);
  useLayoutEffect(() => {
    escapeRef.current = onEscape;
  });

  useEffect(() => {
    if (!active) return;
    const container = ref.current;
    const previous = document.activeElement as HTMLElement | null;
    // Respect an explicit autoFocus, otherwise focus the container itself so
    // that the on-screen keyboard does not pop up on phones.
    if (container && !container.contains(document.activeElement)) container.focus();

    const token = Symbol('focus-trap');
    stack.push(token);

    const onKeyDown = (event: KeyboardEvent) => {
      if (stack[stack.length - 1] !== token) return;
      if (event.key === 'Escape') {
        if (event.defaultPrevented) return;
        escapeRef.current?.();
        return;
      }
      if (event.key !== 'Tab' || !container) return;
      const items = [...container.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (element) => element.offsetParent !== null || element === document.activeElement,
      );
      if (items.length === 0) {
        event.preventDefault();
        return;
      }
      const first = items[0]!;
      const last = items[items.length - 1]!;
      if (
        event.shiftKey &&
        (document.activeElement === first || document.activeElement === container)
      ) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      stack.splice(stack.indexOf(token), 1);
      document.removeEventListener('keydown', onKeyDown);
      previous?.focus?.({ preventScroll: true });
    };
  }, [active, ref]);
}
