'use client';

import { useMemo, useState, type ReactNode } from 'react';
import {
  MainSidebarShell,
  type MainSidebarGroup,
  type MainSidebarItem,
} from '@synapcity/frontend-blocks';
import { ContextSidebarFrame } from './context-sidebar-frame';

export type PlaygroundSidebarContext = MainSidebarItem & {
  groups: MainSidebarGroup[];
};

function firstItem(context?: PlaygroundSidebarContext) {
  return context?.groups.flatMap((group) => group.items)[0];
}

export function PlaygroundMainSidebar({
  contexts,
  children,
}: {
  contexts: PlaygroundSidebarContext[];
  children: ReactNode;
}) {
  const [activeContextId, setActiveContextId] = useState(contexts[0]?.id);
  const [chosenItems, setChosenItems] = useState<Record<string, string>>({});
  const activeContext =
    contexts.find(({ id }) => id === activeContextId) ?? contexts[0];
  const availableItems = useMemo(
    () => activeContext?.groups.flatMap((group) => group.items) ?? [],
    [activeContext],
  );
  const chosenId = activeContext ? chosenItems[activeContext.id] : undefined;
  const activeItem =
    availableItems.find(({ id }) => id === chosenId) ??
    firstItem(activeContext);

  return (
    <div className="h-full min-h-0 overflow-hidden rounded-lg border">
      <MainSidebarShell
        railItems={contexts}
        activeRailItemId={activeContext?.id}
        railLabel="Spaces"
        onSelectRailItem={(item) => setActiveContextId(item.id)}
        panelLabel={activeContext?.label ?? 'No spaces'}
        panelGroups={activeContext?.groups ?? []}
        activePanelItemId={activeItem?.id}
        onSelectPanelItem={(item) => {
          if (!activeContext) return;
          setChosenItems((current) => ({
            ...current,
            [activeContext.id]: item.id,
          }));
        }}
      >
        <ContextSidebarFrame
          contextLabel={activeContext?.label}
          itemLabel={activeItem?.label}
        >
          {children}
        </ContextSidebarFrame>
      </MainSidebarShell>
    </div>
  );
}
