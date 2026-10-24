'use client';

import { useCollectionNavigation } from '../../providers';
import type { EntityItem } from '../../types';
import { EntityIcon } from '../entity-icon';
import { formatEntityDate } from '../../utils';

interface RecentEntityItemsProps {
  items?: EntityItem[];
  /** Builds an address for items that carry none: `${prefix}/${item.id}`. */
  prefix?: string;
  label?: string;
}

export function RecentEntityItems({
  label = 'Recently touched',
  items = [],
  prefix,
}: RecentEntityItemsProps) {
  const { Link } = useCollectionNavigation();
  if (items.length === 0) return null;

  return (
    <aside
      aria-labelledby="recently-touched-heading"
      className="flex w-full flex-col gap-2 rounded-lg bg-muted p-3 lg:w-72"
    >
      <h2
        id="recently-touched-heading"
        className="px-2 text-xs font-medium text-muted-foreground"
      >
        {label}
      </h2>
      <ul className="flex flex-col">
        {items.map((item) => {
          const href =
            item.href ??
            (prefix === undefined ? undefined : `${prefix}/${item.id}`);
          const content = (
            <>
              <EntityIcon
                name={item.icon}
                className="size-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1 truncate">{item.name}</span>
              <time
                dateTime={item.updatedAt}
                className="shrink-0 text-xs text-muted-foreground"
                suppressHydrationWarning
              >
                {formatEntityDate(item.updatedAt)}
              </time>
            </>
          );
          return (
            <li key={item.id}>
              {href === undefined ? (
                <div className="flex items-center gap-2 px-2 py-1.5 text-sm text-foreground">
                  {content}
                </div>
              ) : (
                <Link
                  href={href}
                  className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-foreground outline-none transition-colors hover:bg-background focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {content}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
