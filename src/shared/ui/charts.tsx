/**
 * Lightweight dependency-free SVG charts that follow the theme colours.
 * Each chart exposes an accessible summary via <title>/<desc> and a hidden table.
 */

export interface ChartDatum {
  label: string;
  value: number;
}

function niceMax(value: number): number {
  if (value <= 0) return 1;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const normalized = value / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

function compact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${+(value / 1_000_000).toFixed(1)} млн`;
  if (abs >= 1_000) return `${+(value / 1_000).toFixed(1)} тыс`;
  return String(Math.round(value));
}

function DataTable({ data, format }: { data: ChartDatum[]; format: (value: number) => string }) {
  return (
    <table className="sr-only">
      <tbody>
        {data.map((item) => (
          <tr key={item.label}>
            <th scope="row">{item.label}</th>
            <td>{format(item.value)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function ColumnChart({
  data,
  title,
  format = compact,
  height = 200,
}: {
  data: ChartDatum[];
  title: string;
  format?: (value: number) => string;
  height?: number;
}) {
  const max = niceMax(Math.max(0, ...data.map((item) => item.value)));
  const ticks = [1, 0.75, 0.5, 0.25, 0];

  // HTML/CSS instead of a scaled SVG keeps labels readable on narrow screens.
  return (
    <figure className="w-full">
      <div className="flex gap-2" style={{ height }} role="img" aria-label={title}>
        <div className="muted flex shrink-0 flex-col justify-between pb-6 text-right text-[10.5px] leading-none">
          {ticks.map((tick) => (
            <span key={tick}>{compact(max * tick)}</span>
          ))}
        </div>
        <div className="relative flex min-w-0 flex-1 flex-col">
          <div className="relative flex-1">
            {ticks.map((tick) => (
              <div
                key={tick}
                className="absolute inset-x-0 border-t border-[rgb(var(--line)/0.08)]"
                style={{ top: `${(1 - tick) * 100}%` }}
              />
            ))}
            <div className="absolute inset-0 flex items-end justify-around gap-1.5 px-1">
              {data.map((item) => (
                <div
                  key={item.label}
                  title={`${item.label}: ${format(item.value)}`}
                  className="w-full max-w-[44px] rounded-t-md transition-[height] duration-500"
                  style={{
                    height: `${(item.value / max) * 100}%`,
                    background:
                      'linear-gradient(0deg, rgb(var(--color-primary)), rgb(var(--color-secondary)))',
                  }}
                />
              ))}
            </div>
          </div>
          <div className="muted flex h-6 items-end justify-around gap-1.5 px-1 text-[11.5px]">
            {data.map((item) => (
              <span key={item.label} className="w-full max-w-[44px] text-center">
                {item.label}
              </span>
            ))}
          </div>
        </div>
      </div>
      <DataTable data={data} format={format} />
    </figure>
  );
}

export function BarList({
  data,
  title,
  format = compact,
}: {
  data: ChartDatum[];
  title: string;
  format?: (value: number) => string;
}) {
  const max = Math.max(1, ...data.map((item) => item.value));
  return (
    <ul aria-label={title} className="flex flex-col gap-3">
      {data.map((item) => (
        <li key={item.label}>
          <div className="flex items-baseline justify-between gap-3 text-[13px]">
            <span className="min-w-0 truncate">{item.label}</span>
            <span className="shrink-0 font-semibold">{format(item.value)}</span>
          </div>
          <div className="soft-bg mt-1.5 h-2 overflow-hidden rounded-full">
            <div
              className="h-full rounded-full"
              style={{
                width: `${(item.value / max) * 100}%`,
                background:
                  'linear-gradient(90deg, rgb(var(--color-primary)), rgb(var(--color-secondary)))',
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

const DONUT_COLORS = [
  '#5b47d6',
  '#f0663a',
  '#0f766e',
  '#1d4ed8',
  '#be185d',
  '#d97706',
  '#7c3aed',
  '#0891b2',
  '#65a30d',
  '#db2777',
  '#525a68',
  '#16a34a',
];

export function DonutChart({ data, title }: { data: ChartDatum[]; title: string }) {
  const total = data.reduce((sum, item) => sum + item.value, 0) || 1;
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <figure className="flex flex-col items-center gap-5">
      <svg
        viewBox="0 0 180 180"
        className="h-44 w-44 shrink-0 -rotate-90"
        role="img"
        aria-label={title}
      >
        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke="rgb(var(--surface-2))"
          strokeWidth="26"
        />
        {data.map((item, index) => {
          const length = (item.value / total) * circumference;
          const dash = `${length} ${circumference - length}`;
          const circle = (
            <circle
              key={item.label}
              cx="90"
              cy="90"
              r={radius}
              fill="none"
              stroke={DONUT_COLORS[index % DONUT_COLORS.length]}
              strokeWidth="26"
              strokeDasharray={dash}
              strokeDashoffset={-offset}
            >
              <title>{`${item.label}: ${item.value}`}</title>
            </circle>
          );
          offset += length;
          return circle;
        })}
      </svg>
      <ul className="grid w-full grid-cols-1 gap-x-4 gap-y-1.5 text-[12.5px]">
        {data.map((item, index) => (
          <li key={item.label} className="flex items-center gap-2">
            <span
              aria-hidden
              className="h-3 w-3 shrink-0 rounded-sm"
              style={{ background: DONUT_COLORS[index % DONUT_COLORS.length] }}
            />
            <span className="min-w-0 truncate">{item.label}</span>
            <span className="muted ml-auto shrink-0">
              {item.value} · {Math.round((item.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </figure>
  );
}
