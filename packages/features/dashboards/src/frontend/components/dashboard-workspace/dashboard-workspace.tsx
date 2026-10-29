'use client';

import { type WidgetType } from '@synapcity/domain-dashboards';
import { resolveBreakpoint, type Breakpoint } from '@synapcity/domain-grids';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@synapcity/frontend-ui/core/alert';
import { useEffect } from 'react';

import type { DashboardLinkItem, DashboardStorage } from '../../../contracts';
import { type DashboardLinkComponent } from '../../config';
import { useElementWidth } from '../../hooks/use-element-width';
import { useDashboardStore } from '../../store';
import { DashboardCanvas } from '../dashboard-canvas';
import { DashboardEditorSurface } from '../dashboard-editor-surface';
import { WidgetsPanel } from '../widgets-panel';
import { DashboardWorkspaceProvider } from './dashboard-workspace-provider';
import { DashboardWorkspaceSkeleton } from './dashboard-workspace-skeleton';

/**
 * The editable surface with the widgets panel in a column beside the canvas
 * while editing: the layout `DashboardWorkspace` uses on its own. A host with a
 * panel of its own composes `DashboardEditorSurface` and
 * `DashboardWidgetsDestination` instead. The layout follows the canvas's own
 * width until the person picks one in the toolbar.
 */
export function WorkspaceLayout() {
  const editMode = useDashboardStore((s) => s.editMode);
  return (
    <DashboardEditorSurface
      beside={
        editMode && (
          <aside
            aria-label="Widgets"
            className="max-h-1/2 w-full shrink-0 overflow-auto border-t border-border p-4 md:max-h-none md:w-80 md:border-t-0 md:border-l"
          >
            <WidgetsPanel />
          </aside>
        )
      }
    />
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
 * saves, so a dashboard that could not be read is never overwritten. It is
 * `DashboardWorkspaceProvider` with this package's own layout; a host that
 * frames the dashboard itself uses the provider and the surface directly.
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
  return (
    <DashboardWorkspaceProvider
      dashboardId={dashboardId}
      ownerId={ownerId}
      storage={storage}
      now={now}
      breakpoint={breakpoint}
      readOnly={readOnly}
      items={items}
      widgetTypes={widgetTypes}
      persistsStatus={persistsStatus}
      LinkComponent={LinkComponent}
      onReload={onReload}
      fallback={<DashboardWorkspaceSkeleton />}
      failureFallback={
        <Alert variant="destructive">
          <AlertTitle>This dashboard could not be loaded.</AlertTitle>
          <AlertDescription>
            Nothing was changed. Reload the page to try again.
          </AlertDescription>
        </Alert>
      }
    >
      {readOnly ? <ReadOnlyLayout /> : <WorkspaceLayout />}
    </DashboardWorkspaceProvider>
  );
}
