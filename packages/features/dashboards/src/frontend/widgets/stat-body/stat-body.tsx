import type { Metric } from '@synapcity/domain-prototypes';

export function StatBody({ metric }: { metric: Metric }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{metric.unit}</span>
      {/* Value and note share a baseline so the stat fits its compact default height. */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <span className="text-2xl leading-none font-bold text-foreground tabular-nums">
          {metric.value.toLocaleString()}
        </span>
        <span className="text-sm text-success">{metric.note}</span>
      </div>
    </div>
  );
}
