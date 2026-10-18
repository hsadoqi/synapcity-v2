import { EntityItem, Space } from '@synapcity/frontend-ui/types/entity';
import { EntityShell } from '@synapcity/frontend-ui/blocks/entity/entity-shell';

export function EntityContent({
  userId,
  createFixture,
  getRecentItems,
  children,
}: {
  userId: string;
  createFixture?: ({ ownerId }: { ownerId?: string }) => Space;
  getRecentItems: (entity: Space) => EntityItem[];
  children?: React.ReactNode;
}) {
  const entityItem = createFixture?.({ ownerId: userId });
  return (
    <div className="flex flex-col flex-1 gap-6">
      {entityItem && (
        <EntityShell
          entity={{ ...entityItem }}
          showRecentItems
          getRecentItems={getRecentItems}
        >
          {children}
        </EntityShell>
      )}
    </div>
  );
}
