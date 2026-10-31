'use client';

import type { ReactNode } from 'react';
import { ContextSidebarProviders } from './context-sidebar-providers';
import {
  PlaygroundMainSidebar,
  type PlaygroundSidebarContext,
} from './main-sidebar';

export function ContextSidebarShell({
  contexts,
  children,
}: {
  contexts: PlaygroundSidebarContext[];
  children: ReactNode;
}) {
  return (
    <ContextSidebarProviders>
      <PlaygroundMainSidebar contexts={contexts}>
        {children}
      </PlaygroundMainSidebar>
    </ContextSidebarProviders>
  );
}
