'use client';

import {
  createComposition,
  type WidgetType,
} from '@synapcity/domain-dashboards';
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
import { useShallow } from 'zustand/react/shallow';

import type {
  DashboardLinkItem,
  DashboardSnapshot,
  DashboardStorage,
} from '../../../contracts';
import {
  DashboardConfigProvider,
  type DashboardLinkComponent,
} from '../../config';
import { useElementWidth } from '../../hooks/use-element-width';
import { ClockProvider } from '../../hooks/use-now';
import { connectSaves } from '../../storage';
import { DashboardStoreProvider, useDashboardStore } from '../../store';
import { focusPalette, focusWidget } from '../../utils/focus';
import { BreakpointToolbar } from '../breakpoint-toolbar';
import { DashboardCanvas } from '../dashboard-canvas';
import { LiveAnnouncer } from '../live-announcer';
import { SaveStatusIndicator } from '../save-status';
import { UndoRemove } from '../undo-remove';
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

/**
 * Moves focus after the set of widgets changes: to a widget just added or
 * restored, and after a removal to the next widget in reading order, or to the
 * palette when none is left. Nothing moves on the first render.
 */
function useFocusAfterWidgetChanges() {
  const ids = useDashboardStore(
    useShallow((s) => s.composition.widgets.map((w) => w.id)),
  );
  const removed = useDashboardStore((s) => s.removed);
  const previous = useRef<string[] | null>(null);

  useEffect(() => {
    const before = previous.current;
    previous.current = ids;
    if (!before) return;
    const added = ids.filter((id) => !before.includes(id));
    const gone = before.filter((id) => !ids.includes(id));
    const moveFocus = () => {
      const lastAdded = added[added.length - 1];
      if (lastAdded) {
        focusWidget(lastAdded);
      } else if (gone.length > 0) {
        const next = removed?.focusAfter;
        if (!next || !focusWidget(next)) focusPalette();
      }
    };
    const frame = requestAnimationFrame(moveFocus);
    // A popover that closed with the removal hands focus back to its trigger,
    // which is gone with the widget, a moment after the frame: look again.
    const retry = setTimeout(() => {
      if (!document.activeElement || document.activeElement === document.body) {
        moveFocus();
      }
    }, 80);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(retry);
    };
  }, [ids, removed]);
}

/**
 * The toolbar, the canvas and, in edit mode, the widgets panel beside it. The
 * layout follows the canvas's own width until the person picks one in the
 * toolbar, so the contextual panel opening or a narrow window switches it.
 */
export function WorkspaceLayout() {
  const editMode = useDashboardStore((s) => s.editMode);
  const toggleEditMode = useDashboardStore((s) => s.toggleEditMode);
  const setBreakpoint = useDashboardStore((s) => s.setBreakpoint);
  const [ref, width] = useElementWidth<HTMLDivElement>();
  useEffect(() => {
    if (width) setBreakpoint(resolveBreakpoint(width));
  }, [width, setBreakpoint]);
  useFocusAfterWidgetChanges();

  return (
    <div ref={ref} className="flex min-h-0 min-w-0 flex-1 flex-col">
      <LiveAnnouncer />
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-border px-5 py-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <SaveStatusIndicator />
          <UndoRemove />
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
      </div>
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <DashboardCanvas />
        {editMode && (
          <aside
            aria-label="Widgets"
            className="max-h-1/2 w-full shrink-0 overflow-auto border-t border-border p-4 md:max-h-none md:w-80 md:border-t-0 md:border-l"
          >
            <WidgetsPanel />
          </aside>
        )}
      </div>
    </div>
  );
}

/**
 * Read-only: only the canvas, laid out at the breakpoint its own width calls
 * for, so the same dashboard shows its narrow layout in a narrow container
 * (such as beside the contextual panel) whatever the window's size.
 */
function ReadOnlyLayout() {
  const setBreakpoint = useDashboardStore((s) => s.setBreakpoint);
  const [ref, width] = useElementWidth<HTMLDivElement>();
  useEffect(() => {
    if (width) setBreakpoint(resolveBreakpoint(width));
  }, [width, setBreakpoint]);
  return (
    <div
      ref={ref}
      data-slot="dashboard-read-only"
      className="flex min-h-0 min-w-0 flex-1"
    >
      <DashboardCanvas deviceFrame={false} />
    </div>
  );
}

/**
 * A dashboard's canvas: reads what was saved through `storage`, then saves
 * every change back and says where the save stands. Read-only, it saves
 * nothing and offers no editing. A failed read shows an error and never
 * saves, so a dashboard that could not be read is never overwritten.
 */
export function DashboardWorkspace({
  dashboardId,
  ownerId,
  storage,
  now,
  breakpoint,
  readOnly = false,
  items,
  widgetTypes,
  persistsStatus,
  LinkComponent,
  onReload,
}: {
  dashboardId: string;
  ownerId: string;
  storage: DashboardStorage;
  /** The clock, for tests and stories; defaults to `Date.now`. */
  now?: () => number;
  /**
   * The breakpoint to open at and keep; by default the canvas's own width
   * chooses it, as it changes.
   */
  breakpoint?: Breakpoint;
  /**
   * Show without editing or saving; the breakpoint then follows the canvas's
   * own width. @default false
   */
  readOnly?: boolean;
  /** The records the Pinned, Last opened and Spaces widgets list. @default [] */
  items?: readonly DashboardLinkItem[];
  /** The widget types the palette offers. @default every type */
  widgetTypes?: readonly WidgetType[];
  /** Whether widgets can be hidden or archived. @default true */
  persistsStatus?: boolean;
  /** How the link widgets render a link. @default a plain anchor */
  LinkComponent?: DashboardLinkComponent;
  /**
   * What Reload does after a conflict. The host that owns the data (a server
   * page) refreshes it; by default the workspace reads `storage` again.
   */
  onReload?: () => void;
}) {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [reloads, setReloads] = useState(0);
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
  }, [storage, dashboardId, reloads]);

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
      <DashboardConfigProvider
        items={items}
        widgetTypes={widgetTypes}
        persistsStatus={persistsStatus}
        LinkComponent={LinkComponent}
        onReload={onReload ?? (() => setReloads((count) => count + 1))}
      >
        <DashboardStoreProvider
          key={`${dashboardId}:${loaded.requestId}`}
          init={{
            composition: loaded.snapshot.composition ?? createComposition(),
            records: loaded.snapshot.records ?? emptyRecords(),
            ownerId,
            breakpoint: breakpoint ?? resolveBreakpoint(window.innerWidth),
            breakpointLocked: breakpoint !== undefined,
            now,
            readOnly,
          }}
          onStore={
            readOnly
              ? undefined
              : (store) =>
                  connectSaves(store, storage, dashboardId, {
                    baseRevision: loaded.snapshot.revision ?? 0,
                  })
          }
        >
          <ClockProvider now={now ?? DEFAULT_NOW}>
            {readOnly ? <ReadOnlyLayout /> : <WorkspaceLayout />}
          </ClockProvider>
        </DashboardStoreProvider>
      </DashboardConfigProvider>
    </TooltipProvider>
  );
}
