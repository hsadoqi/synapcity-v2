import type { EntityItem } from '../../types';
import { EntityShell } from '../entity-shell';

export function EntityContent<T extends EntityItem>({
  userId,
  createFixture,
  getRecentItems,
  children,
}: {
  userId: string;
  createFixture?: ({ ownerId }: { ownerId?: string }) => T;
  getRecentItems: (entity: T) => EntityItem[];
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
