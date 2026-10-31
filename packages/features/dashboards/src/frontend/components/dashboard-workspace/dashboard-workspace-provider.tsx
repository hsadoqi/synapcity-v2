'use client';

import {
  createComposition,
  type WidgetType,
} from '@synapcity/domain-dashboards';
import { resolveBreakpoint, type Breakpoint } from '@synapcity/domain-grids';
import { emptyRecords } from '@synapcity/domain-prototypes';
import { TooltipProvider } from '@synapcity/frontend-ui/core/tooltip';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { StoreApi } from 'zustand/vanilla';

import type {
  DashboardLinkItem,
  DashboardSnapshot,
  DashboardStorage,
} from '../../../contracts';
import {
  DashboardConfigProvider,
  type DashboardLinkComponent,
} from '../../config';
import { ClockProvider } from '../../hooks/use-now';
import { connectSaves } from '../../storage';
import {
  createDashboardStore,
  DashboardStoreScope,
  type DashboardStore,
} from '../../store';

const DEFAULT_NOW = () => Date.now();

/** What one store was built from; a different source means a different store. */
type Source = {
  dashboardId: string;
  storage: DashboardStorage;
  composition: DashboardSnapshot['composition'];
  records: DashboardSnapshot['records'];
  revision: number;
  /** Which read produced it, so reading again replaces the store even when nothing differs. */
  request: number;
};

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

type Active = { source: Source; store: StoreApi<DashboardStore> };

function sameSource(a: Source, b: Source) {
  return (
    a.dashboardId === b.dashboardId &&
    a.storage === b.storage &&
    a.composition === b.composition &&
    a.records === b.records &&
    a.revision === b.revision &&
    a.request === b.request
  );
}

/**
 * Everything one dashboard needs beneath it: the read, the host's choices, the
 * clock, the store and its saves. It renders no layout, so a host can put its
 * own frame (a resource view with a contextual panel) between the provider and
 * the parts that read the store.
 *
 * **The store is replaced, never remounted.** A new snapshot (the host
 * refreshed after a conflict, say) builds a new store and the children stay
 * mounted, so what the host keeps in them (a panel's destination and width)
 * survives. Consumers move to the new store by context; saves for the old
 * store are disconnected and the new store saves from the new snapshot's
 * revision. Edit mode and the chosen layout carry over; selection, the
 * undo offer, the save state and the announcement start fresh.
 *
 * With `snapshot` the host already holds the dashboard, so the first render
 * has the store and no `fallback` shows. Without it the provider reads
 * `storage` and shows `fallback` meanwhile, or `failureFallback` when the read
 * fails; nothing is saved for a dashboard that could not be read.
 */
export function DashboardWorkspaceProvider({
  dashboardId,
  ownerId,
  storage,
  snapshot,
  fallback = null,
  failureFallback = null,
  now,
  breakpoint,
  readOnly = false,
  items,
  widgetTypes,
  persistsStatus,
  LinkComponent,
  onReload,
  children,
}: {
  dashboardId: string;
  ownerId: string;
  storage: DashboardStorage;
  /**
   * The dashboard as the host already has it. Keep it stable between renders:
   * a different composition, records or revision replaces the store.
   */
  snapshot?: DashboardSnapshot;
  /** Shown while the read runs. @default nothing */
  fallback?: ReactNode;
  /** Shown when the read fails. @default nothing */
  failureFallback?: ReactNode;
  /** The clock, for tests and stories; defaults to `Date.now`. */
  now?: () => number;
  /** The breakpoint to open at and keep; by default the canvas's own width chooses it. */
  breakpoint?: Breakpoint;
  /** Show without editing or saving. @default false */
  readOnly?: boolean;
  items?: readonly DashboardLinkItem[];
  widgetTypes?: readonly WidgetType[];
  persistsStatus?: boolean;
  LinkComponent?: DashboardLinkComponent;
  /** What Reload does after a conflict; by default the provider reads `storage` again. */
  onReload?: () => void;
  children: ReactNode;
}) {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [reloads, setReloads] = useState(0);
  const loadRequest = useRef(0);

  useEffect(() => {
    if (snapshot) return;
    let current = true;
    const requestId = ++loadRequest.current;
    storage.load(dashboardId).then(
      (read) =>
        current &&
        setLoaded({
          dashboardId,
          requestId,
          state: 'ready',
          storage,
          snapshot: read,
        }),
      () =>
        current &&
        setLoaded({ dashboardId, requestId, state: 'failed', storage }),
    );
    return () => {
      current = false;
    };
  }, [snapshot, storage, dashboardId, reloads]);

  const current =
    loaded?.dashboardId === dashboardId && loaded.storage === storage
      ? loaded
      : undefined;
  const read =
    snapshot ?? (current?.state === 'ready' ? current.snapshot : undefined);
  const source: Source | undefined = read && {
    dashboardId,
    storage,
    composition: read.composition,
    records: read.records,
    revision: read.revision ?? 0,
    request: snapshot || current?.state !== 'ready' ? 0 : current.requestId,
  };

  const [active, setActive] = useState<Active | null>(null);
  if (source && (!active || !sameSource(active.source, source))) {
    // Derived during render, as React advises for state that follows props.
    // A replacement for the same dashboard keeps the person's view state.
    const before =
      active && active.source.dashboardId === dashboardId
        ? active.store.getState()
        : null;
    setActive({
      source,
      store: createDashboardStore({
        composition: source.composition ?? createComposition(),
        records: source.records ?? emptyRecords(),
        ownerId,
        breakpoint:
          before?.breakpoint ??
          breakpoint ??
          // The server has no window; the canvas sets the width's breakpoint once measured.
          (typeof window === 'undefined'
            ? 'lg'
            : resolveBreakpoint(window.innerWidth)),
        breakpointLocked: before?.breakpointLocked ?? breakpoint !== undefined,
        editMode: before?.editMode ?? false,
        now,
        readOnly,
      }),
    });
  }
  const ready = active && source && sameSource(active.source, source);

  useEffect(() => {
    if (!active || readOnly) return;
    return connectSaves(
      active.store,
      active.source.storage,
      active.source.dashboardId,
      { baseRevision: active.source.revision },
    );
  }, [active, readOnly]);

  if (!snapshot && current?.state === 'failed') {
    return <>{failureFallback}</>;
  }
  if (!ready || !active) return <>{fallback}</>;

  return (
    <TooltipProvider>
      <DashboardConfigProvider
        items={items}
        widgetTypes={widgetTypes}
        persistsStatus={persistsStatus}
        LinkComponent={LinkComponent}
        onReload={onReload ?? (() => setReloads((count) => count + 1))}
      >
        <DashboardStoreScope store={active.store}>
          <ClockProvider now={now ?? DEFAULT_NOW}>{children}</ClockProvider>
        </DashboardStoreScope>
      </DashboardConfigProvider>
    </TooltipProvider>
  );
}
