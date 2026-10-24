import { goalPercent, type Goal } from '@synapcity/domain-prototypes';
import { Input } from '@synapcity/frontend-ui/core/input';

export type GoalChange = { current?: number; target?: number };

/** Edits commit on blur or Enter; an empty or non-numeric entry is ignored. */
export function ProgressBody({
  goal,
  onChange,
}: {
  goal: Goal;
  onChange?: (patch: GoalChange) => void;
}) {
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
      {onChange && (
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <label className="flex items-center gap-1.5">
            Current
            <Input
              key={goal.current}
              type="number"
              min={0}
              defaultValue={goal.current}
              className="w-20"
              onBlur={(event) => {
                const value = event.currentTarget.valueAsNumber;
                if (Number.isFinite(value) && value >= 0) {
                  onChange({ current: value });
                } else {
                  event.currentTarget.value = String(goal.current);
                }
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') event.currentTarget.blur();
              }}
            />
          </label>
          <label className="flex items-center gap-1.5">
            Target
            <Input
              key={goal.target}
              type="number"
              min={0}
              defaultValue={goal.target}
              className="w-20"
              onBlur={(event) => {
                const value = event.currentTarget.valueAsNumber;
                if (Number.isFinite(value) && value >= 0) {
                  onChange({ target: value });
                } else {
                  event.currentTarget.value = String(goal.target);
                }
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') event.currentTarget.blur();
              }}
            />
          </label>
        </div>
      )}
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
          className="h-full bg-primary transition-all duration-300 motion-reduce:transition-none"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
