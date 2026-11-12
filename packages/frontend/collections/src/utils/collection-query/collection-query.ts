import type {
  CollectionFilters,
  CollectionItem,
  CollectionItemAction,
  CollectionSort,
} from '../../types';

/**
 * Applies an item action to a list and returns the new list. Actions that do
 * not change the list (open, rename) return the same array, so callers can
 * skip a state update.
 */
export function applyItemAction(
  list: CollectionItem[],
  action: CollectionItemAction,
  item: CollectionItem,
  now: Date,
): CollectionItem[] {
  switch (action) {
    case 'toggle-pin':
      return list.map((entry) =>
        entry.id === item.id ? { ...entry, pinned: !entry.pinned } : entry,
      );
    case 'duplicate':
      return [
        {
          ...item,
          id: `${item.id}-copy-${list.length}`,
          title: `${item.title} (copy)`,
          pinned: false,
          updatedAt: now.toISOString(),
          createdAt: now.toISOString(),
        },
        ...list,
      ];
    case 'delete':
      return list.filter((entry) => entry.id !== item.id);
    default:
      return list;
  }
}

const DAY = 24 * 60 * 60 * 1000;
const RECENT_WINDOW_DAYS = 7;

function daysBetween(from: string, now: Date) {
  return Math.max(
    0,
    Math.floor((now.getTime() - new Date(from).getTime()) / DAY),
  );
}

export function formatUpdated(updatedAt: string, now: Date) {
  const days = daysBetween(updatedAt, now);
  if (days === 0) return 'Updated today';
  if (days === 1) return 'Updated yesterday';
  if (days < 7) return `Updated ${days} days ago`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return weeks === 1 ? 'Updated last week' : `Updated ${weeks} weeks ago`;
  }
  const months = Math.floor(days / 30);
  return months === 1 ? 'Updated last month' : `Updated ${months} months ago`;
}

/** Calendar date (y, m, d) of an instant in a time zone, for day comparisons. */
function calendarDay(date: Date, timeZone?: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(date);
  const part = (type: string) =>
    Number(parts.find((entry) => entry.type === type)?.value);
  return Date.UTC(part('year'), part('month') - 1, part('day'));
}

/**
 * A short "how long ago" label: "Just now", "40m ago", "2h ago", "Yesterday",
 * "3d ago", "Last week", "3w ago", then "Last month" / "4mo ago". Days are
 * calendar days in `timeZone` (the viewer's own when omitted), so something
 * from late last night already reads "Yesterday".
 */
export function formatAgo(at: string, now: Date, timeZone?: string) {
  const then = new Date(at);
  const minutes = Math.max(
    0,
    Math.floor((now.getTime() - then.getTime()) / 60000),
  );
  const days = Math.round(
    (calendarDay(now, timeZone) - calendarDay(then, timeZone)) / DAY,
  );

  if (days <= 0) {
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    return `${Math.floor(minutes / 60)}h ago`;
  }
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 14) return 'Last week';
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? 'Last month' : `${months}mo ago`;
}

type CollectionQuery = {
  query: string;
  filters: CollectionFilters;
  sort: CollectionSort;
  now: Date;
};

export function applyCollectionQuery(
  items: CollectionItem[],
  { query, filters, sort, now }: CollectionQuery,
) {
  const needle = query.trim().toLowerCase();

  const filtered = items.filter((item) => {
    if (filters.pinned && !item.pinned) return false;
    if (
      filters.recent &&
      daysBetween(item.updatedAt, now) > RECENT_WINDOW_DAYS
    ) {
      return false;
    }
    if (
      filters.groups.length > 0 &&
      (!item.group || !filters.groups.includes(item.group))
    ) {
      return false;
    }
    if (
      filters.tags.length > 0 &&
      !item.tags.some((tag) => filters.tags.includes(tag))
    ) {
      return false;
    }
    if (!needle) return true;
    return [item.title, item.subtitle, item.group, ...item.tags]
      .filter(Boolean)
      .some((value) => value!.toLowerCase().includes(needle));
  });

  const direction = sort.direction === 'asc' ? 1 : -1;

  return filtered.sort((a, b) => {
    if (sort.field === 'title') {
      return a.title.localeCompare(b.title) * direction;
    }
    if (sort.field === 'used') {
      return (lastActive(a) - lastActive(b)) * direction;
    }
    const key = sort.field === 'created' ? 'createdAt' : 'updatedAt';
    const aTime = new Date(a[key] ?? a.updatedAt).getTime();
    const bTime = new Date(b[key] ?? b.updatedAt).getTime();
    return (aTime - bTime) * direction;
  });
}

/**
 * When an item was last in use: the later of when it was opened and when it
 * changed. Changing something is using it, and an item never opened still has
 * the time it last changed.
 */
function lastActive(item: CollectionItem) {
  const changed = new Date(item.updatedAt).getTime();
  const opened = item.lastViewedAt ? new Date(item.lastViewedAt).getTime() : 0;
  return Math.max(changed, opened);
}

/** Pinned items first, each group keeping the order it came in. Returns a new list. */
export function pinnedFirst(items: CollectionItem[]) {
  return [
    ...items.filter((item) => item.pinned),
    ...items.filter((item) => !item.pinned),
  ];
}

/**
 * Most recently in use first (see `lastActive`), so a new or untouched item
 * still finds a place. Returns a new list.
 */
export function byRecency(items: CollectionItem[]) {
  return [...items].sort((a, b) => lastActive(b) - lastActive(a));
}

/**
 * The tags used across `items`, most used first (ties alphabetical), so a
 * short row of tag chips can show the ones that matter.
 */
export function tagsByUse(items: CollectionItem[]) {
  const counts = new Map<string, number>();
  for (const item of items) {
    for (const tag of new Set(item.tags)) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([tag]) => tag);
}
