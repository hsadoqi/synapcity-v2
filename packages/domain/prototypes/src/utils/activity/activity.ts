import type { Activity, PrototypeRecords } from '../../types';

/** The `limit` most recent activities, newest first. */
export function recentActivity(
  activity: PrototypeRecords['activity'],
  limit: number,
): Activity[] {
  return Object.values(activity)
    .sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt))
    .slice(0, limit);
}
