import type { EnergyPoint, WeekBucket } from '@/lib/history/stats';

const W = 600;

/** Energy over time. A line through ratings from 1 to 10, newest on the right. */
export function EnergyTrend({ points }: { points: EnergyPoint[] }) {
  const H = 140;
  const pad = { l: 28, r: 12, t: 12, b: 20 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const x = (i: number) =>
    pad.l +
    (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const y = (v: number) => pad.t + innerH - ((v - 1) / 9) * innerH;
  const d = points
    .map(
      (p, i) =>
        `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)} ${y(p.value).toFixed(1)}`,
    )
    .join(' ');
  const label = `Energy ratings, oldest to newest: ${points.map((p) => p.value).join(', ')}.`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={label}
      className="h-auto w-full"
    >
      {[1, 5, 10].map((tick) => (
        <g key={tick}>
          <line
            x1={pad.l}
            x2={W - pad.r}
            y1={y(tick)}
            y2={y(tick)}
            className="stroke-border"
            strokeWidth={1}
          />
          <text
            x={pad.l - 8}
            y={y(tick) + 4}
            textAnchor="end"
            className="fill-muted-foreground text-[11px]"
          >
            {tick}
          </text>
        </g>
      ))}
      {points.length > 1 ? (
        <path
          d={d}
          fill="none"
          className="stroke-primary"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      ) : null}
      {points.map((p, i) => (
        <circle
          key={p.at}
          cx={x(i)}
          cy={y(p.value)}
          r={3.5}
          className="fill-primary"
        />
      ))}
    </svg>
  );
}

/** Runs per week for the last eight weeks. */
export function WeeklyBars({ weeks }: { weeks: WeekBucket[] }) {
  const H = 130;
  const pad = { l: 8, r: 8, t: 18, b: 24 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const max = Math.max(1, ...weeks.map((w) => w.count));
  const slot = innerW / weeks.length;
  const barW = Math.min(44, slot * 0.6);
  const label = `Runs per week, oldest to newest: ${weeks.map((w) => w.count).join(', ')}.`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={label}
      className="h-auto w-full"
    >
      <line
        x1={pad.l}
        x2={W - pad.r}
        y1={pad.t + innerH}
        y2={pad.t + innerH}
        className="stroke-border"
      />
      {weeks.map((w, i) => {
        const h = (w.count / max) * innerH;
        const cx = pad.l + slot * i + slot / 2;
        const [, month, day] = w.start.split('-');
        return (
          <g key={w.start}>
            <rect
              x={cx - barW / 2}
              y={pad.t + innerH - h}
              width={barW}
              height={Math.max(h, w.count > 0 ? 2 : 0)}
              rx={2}
              className={w.count > 0 ? 'fill-primary' : 'fill-border'}
            />
            {w.count > 0 ? (
              <text
                x={cx}
                y={pad.t + innerH - h - 5}
                textAnchor="middle"
                className="fill-foreground text-[11px]"
              >
                {w.count}
              </text>
            ) : null}
            <text
              x={cx}
              y={H - 6}
              textAnchor="middle"
              className="fill-muted-foreground text-[10px]"
            >
              {`${Number(day)}/${Number(month)}`}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
