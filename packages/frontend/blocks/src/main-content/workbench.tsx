'use client';

import { SidebarInset } from '@synapcity/frontend-ui/core/sidebar';
import { EmptyWorkspace } from './empty-workspace';
import { Workspace } from '../types';

/** The scrolling area beside the sidebar. It shows what it is given, or the empty state. */
export function Workbench({
  empty,
  children,
}: {
  empty?: Workspace;
  children?: React.ReactNode;
}) {
  return (
    <SidebarInset className="min-h-0 min-w-0 overflow-hidden">
      <div
        tabIndex={0}
        role="region"
        aria-label="Content"
        className="flex-1 overflow-auto p-4 focus-visible:outline-2 focus-visible:outline-ring"
      >
        {empty ? <EmptyWorkspace workspace={empty} /> : children}
      </div>
    </SidebarInset>
  );
}
