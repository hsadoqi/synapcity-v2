'use client';

import { Separator } from '@synapcity/frontend-ui/core/separator';
import { RecentEntityItems } from '../recent-entity-items';
import { EntityHeader } from '../entity-header';
import type { EntityItem } from '../../types';
import { toast } from '@synapcity/frontend-ui/core/toast';

interface EntityShellProps {
  entity: EntityItem;
  /**
   * Already chosen by the caller. This is a client component, so it takes data
   * rather than a function: a server component cannot pass it a callback.
   */
  recentItems?: EntityItem[];
  children?: React.ReactNode;
}
export function EntityShell({
  entity,
  recentItems = [],
  children,
}: EntityShellProps) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-6 py-10 lg:py-14">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
        <EntityHeader
          name={entity.name}
          description={entity.description}
          onNewDocument={() => {
            toast.add({ type: 'info', title: 'New document created' });
          }}
          onNewDashboard={() => {
            toast.add({ type: 'info', title: 'New dashboard created' });
          }}
          onRename={() => {
            toast.add({ type: 'info', title: `${entity.name} renamed` });
          }}
          onArchive={() => {
            toast.add({ type: 'info', title: `${entity.name} archived` });
          }}
        />
        {recentItems.length > 0 && (
          <RecentEntityItems
            items={recentItems}
            prefix={`/${entity.kind}s/${entity.id}`}
          />
        )}
      </div>

      <Separator />
      {children}
    </div>
  );
}
