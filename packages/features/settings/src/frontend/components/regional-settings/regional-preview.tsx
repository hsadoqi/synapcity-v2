import { cn } from '@synapcity/frontend-ui/lib/utils';
import {
  formatDate,
  formatTime,
  type RegionalSettings,
} from '@synapcity/domain-preferences';
import { draftFormatting, formatNumber } from './regional-rows';

const week = [
  ['sunday', 'Sunday'],
  ['monday', 'Monday'],
  ['tuesday', 'Tuesday'],
  ['wednesday', 'Wednesday'],
  ['thursday', 'Thursday'],
  ['friday', 'Friday'],
  ['saturday', 'Saturday'],
] as const;

/** The week in calendar order, starting on the chosen day. */
function weekFrom(first: RegionalSettings['firstDayOfWeek']) {
  const start = week.findIndex(([day]) => day === first);
  return [...week.slice(start), ...week.slice(0, start)];
}

/**
 * The tab's choices applied to now: the time, today, a number and a week. It
 * shows the draft, so a choice reads here before it is saved. `now` is null
 * until the browser renders, so the server and the first client render match.
 */
export function RegionalPreview({
  regional,
  now,
}: {
  regional: RegionalSettings;
  now: Date | null;
}) {
  const days = weekFrom(regional.firstDayOfWeek);
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
      <div>
        <dt className="text-xs text-muted-foreground">Now</dt>
        <dd className="text-lg font-medium tabular-nums">
          {now ? formatTime(now, draftFormatting(regional)) : '…'}
        </dd>
      </div>
      <div>
        <dt className="text-xs text-muted-foreground">Today</dt>
        <dd className="text-lg font-medium tabular-nums">
          {now ? formatDate(now, draftFormatting(regional)) : '…'}
        </dd>
      </div>
      <div>
        <dt className="text-xs text-muted-foreground">A number</dt>
        <dd className="text-lg font-medium tabular-nums">
          {formatNumber(regional.numberFormat)}
        </dd>
      </div>
      <div>
        <dt className="text-xs text-muted-foreground">A week</dt>
        <dd className="mt-1 grid grid-cols-7 gap-1">
          {days.map(([day, name], index) => (
            <abbr
              key={day}
              title={name}
              className={cn(
                'text-center text-xs no-underline',
                index === 0
                  ? 'font-semibold text-foreground'
                  : 'text-muted-foreground',
              )}
            >
              {name[0]}
            </abbr>
          ))}
        </dd>
      </div>
    </dl>
  );
}
