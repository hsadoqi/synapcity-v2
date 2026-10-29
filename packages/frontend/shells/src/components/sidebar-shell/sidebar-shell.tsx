'use client';

import { useEffect, useRef, useState } from 'react';

import {
  SidebarInset,
  SidebarProvider,
} from '@synapcity/frontend-ui/core/sidebar';
import { TooltipProvider } from '@synapcity/frontend-ui/core/tooltip';
import { GlobalPanelShell } from '../root-shell/global-panel';
import {
  ContextualPanelShell,
  type ContextualPanelDestination,
} from '../contextual-panel';

/** Below this container width the sidebar folds to icons; at or above it, it opens. */
const WIDE_ENOUGH_PX = 1024;

/**
 * Opens the sidebar when its container is wide and folds it when narrow,
 * deciding again only when the width crosses the line, so the person's own
 * toggle holds until the room changes.
 */
function useFitToContainer() {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === 'undefined') return;
    let wide: boolean | null = null;
    const observer = new ResizeObserver(([entry]) => {
      const nowWide = (entry?.contentRect.width ?? 0) >= WIDE_ENOUGH_PX;
      if (nowWide !== wide) {
        wide = nowWide;
        setOpen(nowWide);
      }
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return { ref, open, setOpen };
}

/**
 * The signed-in frame: a sidebar beside the page, with the header and global
 * panel above and beside the page. It fills the box it is placed in, not the
 * window, and the sidebar opens or folds to icons with that box's width. The
 * caller supplies the sidebar, so the frame never decides what it lists.
 */
export const SidebarShell = ({
  header,
  sidebar,
  children,
  globalPanel,
  contextualPanel,
}: {
  header: React.ReactNode | null;
  sidebar: React.ReactNode;
  children: React.ReactNode;
  globalPanel?: React.ReactNode;
  /** The contextual panel's destinations; without any, there is no panel or rail. */
  contextualPanel?: readonly ContextualPanelDestination[];
}) => {
  const { ref, open, setOpen } = useFitToContainer();

  return (
    <TooltipProvider>
      <SidebarProvider
        ref={ref}
        contained
        open={open}
        onOpenChange={setOpen}
        className="min-h-0 flex-1"
      >
        {sidebar}
        {/* The shell is exactly its container's height, so the header stays
            put and only the work surface below it scrolls. A page that fills
            the screen instead (settings) opts in through RootContent. min-w-0
            lets wide content shrink instead of pushing the inset past the
            container. */}
        <SidebarInset className="min-h-0 min-w-0 overflow-hidden">
          <GlobalPanelShell header={header} panel={globalPanel}>
            {contextualPanel?.length ? (
              <ContextualPanelShell destinations={contextualPanel}>
                {children}
              </ContextualPanelShell>
            ) : (
              children
            )}
          </GlobalPanelShell>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
};
