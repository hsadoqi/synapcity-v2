import type { DashboardItem, DocumentItem } from '../shared/types';
import { SpaceIcon } from './space-icon';

interface RecentItemsProps {
  items?: (DocumentItem | DashboardItem)[];
  prefix: string;
  label?: string;
}

export function RecentItems({
  label = 'Recent Items',
  items = [],
  prefix,
}: RecentItemsProps) {
  if (items.length === 0) return null;

  const updatedLabel = new Date(
    items[0]?.updatedAt ?? new Date(),
  ).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <aside
      aria-labelledby="recently-touched-heading"
      className="flex w-full flex-col gap-2 rounded-md bg-muted p-3 lg:w-72"
    >
      <h2
        id="recently-touched-heading"
        className="px-2 text-xs font-medium text-muted-foreground"
      >
        {label}
      </h2>
      <ul className="flex flex-col">
        {items.map((item) => {
          //   const Icon = kindIcon[item.kind]
          return (
            <li key={item.id}>
              <a
                href={`${prefix}/${item.id}`}
                className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-foreground outline-none transition-colors hover:bg-background focus-visible:ring-2 focus-visible:ring-ring"
              >
                <SpaceIcon
                  name={item.icon}
                  className="size-4 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1 truncate">{item.name}</span>
                <time
                  dateTime={item.updatedAt}
                  className="shrink-0 text-xs text-muted-foreground"
                >
                  {updatedLabel}
                </time>
              </a>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
