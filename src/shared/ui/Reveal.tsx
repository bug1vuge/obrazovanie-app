import {
  useEffect,
  useRef,
  type CSSProperties,
  type ElementType,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { cn } from '@/shared/lib/cn';

type Callback = (entry: IntersectionObserverEntry) => void;
const callbacks = new WeakMap<Element, Callback>();
let observer: IntersectionObserver | null = null;

/** One shared observer for all revealed elements keeps scrolling cheap. */
function getObserver(): IntersectionObserver | null {
  if (typeof IntersectionObserver === 'undefined') return null;
  observer ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) callbacks.get(entry.target)?.(entry);
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
  );
  return observer;
}

interface RevealProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  /** Delay in ms, used to stagger items of a grid. */
  delay?: number;
  children: ReactNode;
}

/**
 * Fades and slides its content in the first time it scrolls into view.
 * Without IntersectionObserver (old browsers, tests) content is shown at once;
 * users who prefer reduced motion get no animation (see CSS).
 */
export function Reveal({
  as: Tag = 'div',
  delay = 0,
  className,
  style,
  children,
  ...rest
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const io = getObserver();
    if (!io) {
      element.classList.add('is-revealed');
      return;
    }
    callbacks.set(element, (entry) => {
      if (!entry.isIntersecting) return;
      element.classList.add('is-revealed');
      io.unobserve(element);
      callbacks.delete(element);
    });
    io.observe(element);
    return () => {
      io.unobserve(element);
      callbacks.delete(element);
    };
  }, []);

  return (
    <Tag
      ref={ref}
      className={cn('reveal', className)}
      style={{ ...style, '--reveal-delay': `${delay}ms` } as CSSProperties}
      {...rest}
    >
      {children}
    </Tag>
  );
}
