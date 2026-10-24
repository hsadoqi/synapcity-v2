import { habitWeek, type Habit } from '@synapcity/domain-prototypes';
import { cn } from '@synapcity/frontend-ui/lib/utils';

import { WEEKDAY_INITIAL, WEEKDAY_NAME } from '../../utils/weekdays';

export function HabitBody({
  habit,
  now,
  onToggleDay,
}: {
  habit: Habit;
  now: number;
  onToggleDay: (day: string) => void;
}) {
  const week = habitWeek(habit, now);
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm text-muted-foreground">
        {week.completed} of 7 days this week
      </span>
      <div className="flex justify-between gap-2">
        {week.days.map((day, i) => (
          <div
            key={day.key}
            className="flex flex-1 flex-col items-center gap-1"
          >
            <button
              type="button"
              aria-pressed={day.done}
              aria-label={`${WEEKDAY_NAME[i]}${day.isToday ? ' (today)' : ''}`}
              disabled={day.isFuture}
              onClick={() => onToggleDay(day.key)}
              className={cn(
                'aspect-square w-full max-w-7 cursor-pointer rounded-sm border-0 p-0 transition-colors motion-reduce:transition-none',
                day.done ? 'bg-primary' : 'bg-muted hover:bg-accent',
                day.isToday && 'outline outline-offset-1 outline-ring',
                'disabled:cursor-not-allowed disabled:opacity-50',
              )}
            />
            <span aria-hidden="true" className="text-xs text-muted-foreground">
              {WEEKDAY_INITIAL[i]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
