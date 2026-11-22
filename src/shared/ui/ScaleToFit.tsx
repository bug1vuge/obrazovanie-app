import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Renders fixed-size content (e.g. a certificate) and scales it down to the
 * available width, so it looks identical on phones and in the exported PDF.
 */
export function ScaleToFit({
  width,
  height,
  children,
}: {
  width: number;
  height: number;
  children: ReactNode;
}) {
  const outerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const outer = outerRef.current;
    if (!outer) return;
    const update = () => {
      const available = outer.clientWidth;
      if (available > 0) setScale(Math.min(1, available / width));
    };
    update();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(update);
    observer.observe(outer);
    return () => observer.disconnect();
  }, [width]);

  return (
    <div ref={outerRef} className="w-full" style={{ height: height * scale }}>
      <div
        className="scale-to-fit-inner"
        style={{
          width,
          height,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          marginInline: scale === 1 ? 'auto' : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
}
