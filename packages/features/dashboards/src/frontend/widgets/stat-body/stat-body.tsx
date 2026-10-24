import type { Metric } from '@synapcity/domain-prototypes';
import { Input } from '@synapcity/frontend-ui/core/input';

/** Commits on blur or Enter; an empty or non-numeric entry is ignored. */
export function StatBody({
  metric,
  onValueChange,
}: {
  metric: Metric;
  onValueChange?: (value: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{metric.unit}</span>
      {/* Value and note share a baseline so the stat fits its compact default height. */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <span className="text-2xl leading-none font-bold text-foreground tabular-nums">
          {onValueChange ? (
            <Input
              key={metric.value}
              type="number"
              defaultValue={metric.value}
              aria-label={`${metric.name} value`}
              className="w-28"
              onBlur={(event) => {
                const value = event.currentTarget.valueAsNumber;
                if (Number.isFinite(value)) onValueChange(value);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') event.currentTarget.blur();
              }}
            />
          ) : (
            metric.value.toLocaleString()
          )}
        </span>
        <span className="text-sm text-success">{metric.note}</span>
      </div>
    </div>
  );
}
