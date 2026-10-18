import type { DashboardItem, DocumentItem, SpaceItem } from '../shared/types';
import { SpaceIcon } from './space-icon';

interface ItemCardProps {
  item: DocumentItem | DashboardItem | SpaceItem;
  slug: string;
}

export function ItemCard({ item, slug }: ItemCardProps) {
  const updatedLabel = new Date(item.updatedAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  return (
    <a
      href={slug}
      className="group flex h-full flex-col gap-6 rounded-md border border-border bg-card p-4 text-foreground transition-colors outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
    >
      <SpaceIcon
        name={item.icon}
        className="size-4 text-muted-foreground transition-colors group-hover:text-foreground"
        aria-hidden="true"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h3 className="truncate text-sm font-medium">{item.name}</h3>
        {item.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground text-pretty">
            {item.description}
          </p>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        <span className="sr-only">Updated </span>
        <time dateTime={item.updatedAt}>{updatedLabel}</time>
      </p>
    </a>
  );
}
