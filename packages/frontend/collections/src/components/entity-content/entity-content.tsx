import type { ReactNode } from 'react';

import type { EntityItem } from '../../types';
import { EntityShell } from '../entity-shell';

export function EntityContent<T extends EntityItem>({
  entity,
  getRecentItems,
  children,
}: {
  entity: T;
  getRecentItems: (entity: T) => EntityItem[];
  children?: ReactNode;
}) {
  // Chosen here, on the server, so only plain data reaches the client shell:
  // the fields it reads, not the whole record (a Space carries its item lists).
  const recentItems = getRecentItems(entity);
  const { id, name, description, icon, kind, createdAt, updatedAt } = entity;
  return (
    <div className="flex flex-col flex-1 gap-6">
      <EntityShell
        entity={{ id, name, description, icon, kind, createdAt, updatedAt }}
        recentItems={recentItems}
      >
        {children}
      </EntityShell>
    </div>
  );
}
