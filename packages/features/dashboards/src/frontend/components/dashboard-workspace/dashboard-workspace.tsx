'use client';

import { createComposition } from '@synapcity/domain-dashboards';
import { resolveBreakpoint, type Breakpoint } from '@synapcity/domain-grids';
import { emptyRecords } from '@synapcity/domain-prototypes';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@synapcity/frontend-ui/core/alert';
import { Button } from '@synapcity/frontend-ui/core/button';
import { TooltipProvider } from '@synapcity/frontend-ui/core/tooltip';
import { PencilRulerIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import type { DashboardSnapshot, DashboardStorage } from '../../../contracts';
import { ClockProvider } from '../../hooks/use-now';
import { connectSaves } from '../../storage';
import { DashboardStoreProvider, useDashboardStore } from '../../store';
import { BreakpointToolbar } from '../breakpoint-toolbar';
import { DashboardCanvas } from '../dashboard-canvas';
import { WidgetsPanel } from '../widgets-panel';
import { DashboardWorkspaceSkeleton } from './dashboard-workspace-skeleton';

/** The outcome of reading one dashboard; a result for another dashboard id means still loading. */
type Loaded =
  | {
      dashboardId: string;
      requestId: number;
      state: 'ready';
      storage: DashboardStorage;
      snapshot: DashboardSnapshot;
    }
  | {
      dashboardId: string;
      requestId: number;
      state: 'failed';
      storage: DashboardStorage;
    };

const DEFAULT_NOW = () => Date.now();

/** The toolbar, the canvas and, in edit mode, the widgets panel beside it. */
export function WorkspaceLayout() {
  const editMode = useDashboardStore((s) => s.editMode);
  const toggleEditMode = useDashboardStore((s) => s.toggleEditMode);
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-end gap-2 border-b border-border px-5 py-2">
        <Button
          variant={editMode ? 'selected' : 'outline'}
          aria-pressed={editMode}
          onClick={toggleEditMode}
        >
          <PencilRulerIcon aria-hidden="true" />
          Edit layout
        </Button>
        <BreakpointToolbar />
      </div>
      <div className="flex min-h-0 flex-1">
        <DashboardCanvas />
        {editMode && (
          <aside
            aria-label="Widgets"
            className="w-80 shrink-0 overflow-auto border-l border-border p-4"
          >
            <WidgetsPanel />
          </aside>
        )}
      </div>
    </div>
  );
}

/**
 * A dashboard's canvas: reads what was saved through `storage`, then saves
 * every change back. A failed read shows an error and never saves, so a
 * dashboard that could not be read is never overwritten.
 */
export function DashboardWorkspace({
  dashboardId,
  ownerId,
  storage,
  now,
  breakpoint,
}: {
  dashboardId: string;
  ownerId: string;
  storage: DashboardStorage;
  /** The clock, for tests and stories; defaults to `Date.now`. */
  now?: () => number;
  /** The breakpoint to open at; defaults to the viewport's. */
  breakpoint?: Breakpoint;
}) {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const loadRequest = useRef(0);

  useEffect(() => {
    let current = true;
    const requestId = ++loadRequest.current;
    storage.load(dashboardId).then(
      (snapshot) =>
        current &&
        setLoaded({
          dashboardId,
          requestId,
          state: 'ready',
          storage,
          snapshot,
        }),
      () =>
        current &&
        setLoaded({
          dashboardId,
          requestId,
          state: 'failed',
          storage,
        }),
    );
    return () => {
      current = false;
    };
  }, [storage, dashboardId]);

  if (
    !loaded ||
    loaded.dashboardId !== dashboardId ||
    loaded.storage !== storage
  )
    return <DashboardWorkspaceSkeleton />;
  if (loaded.state === 'failed') {
    return (
      <Alert variant="destructive">
        <AlertTitle>This dashboard could not be loaded.</AlertTitle>
        <AlertDescription>
          Nothing was changed. Reload the page to try again.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <TooltipProvider>
      <DashboardStoreProvider
        key={`${dashboardId}:${loaded.requestId}`}
        init={{
          composition: loaded.snapshot.composition ?? createComposition(),
          records: loaded.snapshot.records ?? emptyRecords(),
          ownerId,
          breakpoint: breakpoint ?? resolveBreakpoint(window.innerWidth),
          now,
        }}
        onStore={(store) => connectSaves(store, storage, dashboardId)}
      >
        <ClockProvider now={now ?? DEFAULT_NOW}>
          <WorkspaceLayout />
        </ClockProvider>
      </DashboardStoreProvider>
    </TooltipProvider>
  );
}
