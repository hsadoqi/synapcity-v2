import {
  eventsThisWeek,
  weekdayIndex,
  type PrototypeRecords,
} from '@synapcity/domain-prototypes';

import { eventTimeFormat } from '../../utils/time-format';
import { WEEKDAY_SHORT } from '../../utils/weekdays';
import { WidgetEmpty } from '../widget-states';

export function CalendarBody({
  events,
  now,
}: {
  events: PrototypeRecords['event'];
  now: number;
}) {
  const week = eventsThisWeek(events, now);
  if (week.length === 0)
    return <WidgetEmpty>Nothing scheduled this week.</WidgetEmpty>;
  return (
    <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
      {week.map((event) => {
        const startsAt = Date.parse(event.startsAt);
        return (
          <li
            key={event.id}
            className="flex gap-1.5 border-b border-divider py-1.5"
          >
            <span className="min-w-8 text-xs font-semibold text-muted-foreground">
              {WEEKDAY_SHORT[weekdayIndex(startsAt)]}
            </span>
            <div className="flex flex-1 flex-col gap-0.5">
              <span className="text-xs text-foreground">{event.name}</span>
              <time
                className="text-xs text-muted-foreground"
                dateTime={event.startsAt}
              >
                {eventTimeFormat.format(startsAt)}
              </time>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
