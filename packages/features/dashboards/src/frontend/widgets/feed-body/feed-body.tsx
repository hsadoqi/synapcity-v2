import {
  recentActivity,
  type PrototypeRecords,
} from '@synapcity/domain-prototypes';

import { relativeTime } from '../../utils/relative-time';
import { WidgetEmpty } from '../widget-states';

export function FeedBody({
  activity,
  limit,
  now,
}: {
  activity: PrototypeRecords['activity'];
  limit: number;
  now: number;
}) {
  const items = recentActivity(activity, limit);
  if (items.length === 0) return <WidgetEmpty>No activity yet.</WidgetEmpty>;
  return (
    <ul className="m-0 flex list-none flex-col gap-2 p-0">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex flex-col gap-0.5 border-b border-divider py-1.5"
        >
          <span className="text-sm text-foreground">{item.name}</span>
          <time
            className="text-xs text-muted-foreground"
            dateTime={item.occurredAt}
          >
            {relativeTime(item.occurredAt, now)}
          </time>
        </li>
      ))}
    </ul>
  );
}
