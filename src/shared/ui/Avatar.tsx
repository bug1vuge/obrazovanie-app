import { initials } from '@/shared/lib/format';

const GRADIENTS = [
  'linear-gradient(140deg,#5b47d6,#a855f7)',
  'linear-gradient(140deg,#f0663a,#f7b23b)',
  'linear-gradient(140deg,#0f766e,#34d399)',
  'linear-gradient(140deg,#be185d,#f472b6)',
];

export function Avatar({
  name,
  size = 40,
  tone = 0,
}: {
  name: string;
  size?: number;
  tone?: number;
}) {
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{
        width: size,
        height: size,
        background: GRADIENTS[Math.abs(tone) % GRADIENTS.length],
        fontSize: size * 0.36,
      }}
    >
      {initials(name)}
    </span>
  );
}
