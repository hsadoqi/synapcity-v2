import { Badge } from '@synapcity/frontend-ui/core/badge';

import type { CollectionItem } from '@/features/collection/shared';

/** What the hover card shows for a dashboard: the same facts as its row, a little roomier. */
export function DashboardPreview({ item }: { item: CollectionItem }) {
  return (
    <>
      <p className="font-heading text-sm font-medium">{item.title}</p>
      {item.subtitle && (
        <p className="text-pretty text-muted-foreground">{item.subtitle}</p>
      )}
      {item.detail && <p className="text-muted-foreground">{item.detail}</p>}
      {item.tags.length > 0 && (
        <ul role="list" aria-label="Tags" className="flex flex-wrap gap-1">
          {item.tags.map((tag) => (
            <li key={tag}>
              <Badge variant="secondary">{tag}</Badge>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
