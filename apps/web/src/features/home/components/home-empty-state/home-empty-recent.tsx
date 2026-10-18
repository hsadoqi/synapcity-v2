import { Clock } from 'lucide-react';

import { Button } from '@synapcity/frontend-ui/core/button';

import type { CollectionItem } from '@/features/collection/shared';

type HomeEmptyRecentProps = {
  items: CollectionItem[];
  limit?: number;
  onOpen?: (item: CollectionItem) => void;
};

/** A single quiet line of recent items, or a note that they will appear here. */
export function HomeEmptyRecent({
  items,
  limit = 3,
  onOpen,
}: HomeEmptyRecentProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2">
        <Clock aria-hidden="true" className="size-6 text-muted-foreground" />
        <p className="text-center text-sm text-pretty text-muted-foreground">
          The things you return to will settle in here over time.
        </p>
      </div>
    );
  }

  return (
    <nav
      aria-label="Recent"
      className="flex flex-col items-center gap-1 text-sm"
    >
      <span className="text-muted-foreground">Recent</span>
      <ul className="flex max-w-full flex-wrap justify-center gap-x-1">
        {items.slice(0, limit).map((item) => (
          <li key={item.id} className="max-w-full">
            <Button
              variant="link"
              size="sm"
              className="max-w-full"
              onClick={() => onOpen?.(item)}
            >
              <span className="truncate">{item.title}</span>
            </Button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
