'use client';

import { Separator } from '@synapcity/frontend-ui/core/separator';
import { RecentEntityItems } from '../recent-entity-items';
import { EntityHeader } from '../entity-header';
import type { EntityItem } from '../../types';

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
        {/* No header actions until creating, renaming and archiving exist; a
            button that only says it worked is worse than none. */}
        <EntityHeader name={entity.name} description={entity.description} />
        {recentItems.length > 0 && <RecentEntityItems items={recentItems} />}
      </div>

      <Separator />
      {children}
    </div>
  );
}
