import { CollectionItem } from '@/features/collection/shared/types';
import { Button } from '@synapcity/frontend-ui/core/button';

interface EmptyRecentLineProps {
  items: CollectionItem[];
  limit?: number;
  onOpen?: (item: CollectionItem) => void;
}

export function EmptyRecentLine({
  items = [],
  limit = 3,
  onOpen,
}: EmptyRecentLineProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="shrink-0">
          <svg
            className="h-6 w-6 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
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
