import { Separator } from '@synapcity/frontend-ui/core/separator';
import { RecentEntityItems } from '@synapcity/frontend-ui/blocks/entity/recent-entity';
import { EntityHeader } from '@synapcity/frontend-ui/blocks/entity/entity-header';
import type { EntityItem } from '@synapcity/frontend-ui/types/entity';

interface EntityShellProps<T extends EntityItem> {
  entity: T;
  showRecentItems?: boolean;
  getRecentItems?: (entity: T, limit?: number) => EntityItem[];
  children?: React.ReactNode;
}
export function EntityShell<T extends EntityItem>({
  entity,
  showRecentItems = true,
  getRecentItems,
  children,
}: EntityShellProps<T>) {
  const recent = showRecentItems ? getRecentItems?.(entity) : [];

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-6 py-10 lg:py-14">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
        <EntityHeader name={entity.name} description={entity.description} />
        {recent && recent?.length > 0 && (
          <RecentEntityItems
            items={recent}
            prefix={`/${entity.kind}s/${entity.id}`}
          />
        )}
      </div>

      <Separator />
      {children}
    </div>
  );
}
