'use client';

import type { ReactNode } from 'react';
import { SidebarTrigger } from '@synapcity/frontend-ui/core/sidebar';

export function ContextSidebarFrame({
  contextLabel,
  itemLabel,
  children,
}: {
  contextLabel?: string;
  itemLabel?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b px-4">
        <SidebarTrigger />
        <div className="min-w-0">
          <p className="text-muted-foreground truncate text-xs">
            {contextLabel ?? 'No context selected'}
          </p>
          <p className="truncate text-sm font-medium">
            {itemLabel ?? 'Choose an item'}
          </p>
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-auto p-4">{children}</div>
    </div>
  );
}
