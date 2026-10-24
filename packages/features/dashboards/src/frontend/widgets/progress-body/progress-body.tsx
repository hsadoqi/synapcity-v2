import { goalPercent, type Goal } from '@synapcity/domain-prototypes';

export function ProgressBody({ goal }: { goal: Goal }) {
  const percent = goalPercent(goal);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm text-muted-foreground">
          {goal.current} of {goal.target} {goal.unit}
        </span>
        <span className="text-base font-semibold text-foreground tabular-nums">
          {percent}%
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={goal.name}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
      >
        {/* The width is the one dynamic value: the goal's progress. */}
        <div
          className="h-full bg-primary transition-[width] duration-300 motion-reduce:transition-none"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
