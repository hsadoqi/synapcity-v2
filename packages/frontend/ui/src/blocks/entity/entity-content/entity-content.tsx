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
  // Chosen here, on the server, so only plain data reaches the client shell.
  const recentItems = entityItem ? getRecentItems(entityItem) : [];
  return (
    <div className="flex flex-col flex-1 gap-6">
      {entityItem && (
        <EntityShell entity={{ ...entityItem }} recentItems={recentItems}>
          {children}
        </EntityShell>
      )}
    </div>
  );
}
