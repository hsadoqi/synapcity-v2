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
import { LinkItemsLoader } from '../link-items-loader';
import { connectSaves } from '../../storage';
import {
  createDashboardStore,
  DashboardStoreScope,
  type DashboardStore,
} from '../../store';

const DEFAULT_NOW = () => Date.now();

/** What the host handed over: the dashboard, its storage and one read of it. */
type Source = {
  dashboardId: string;
  storage: DashboardStorage;
  composition: DashboardSnapshot['composition'];
  records: DashboardSnapshot['records'];
  revision: number;
  /** Which read produced it, so each read is looked at, even when nothing differs. */
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

/** The live store and the last source it was checked against. */
type Active = { source: Source; store: StoreApi<DashboardStore> };

/** The same read: a host refresh gives new objects, so this is identity. */
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
 * Whether a new read replaces the live store. A new object only says the host
 * read again (every server refresh decodes new objects); the stored revision,
 * which rises by exactly one on every write, says whether the dashboard
 * changed. What the person has not saved yet is never thrown away by a read.
 */
function replaces(
  active: Active,
  next: Source,
  givenUp: StoreApi<DashboardStore> | null,
) {
  // Another dashboard, or another place to save it.
  if (
    next.dashboardId !== active.source.dashboardId ||
    next.storage !== active.source.storage
  ) {
    return true;
  }
  const { saveStatus, savedRevision } = active.store.getState();
  // After a conflict the draft can no longer be saved, but it stays on screen
  // until the person chooses Reload, which gives it up. A refresh the host
  // makes for its own reasons (pin revalidation, an auth event) keeps it.
  if (saveStatus === 'conflict') return active.store === givenUp;
  // Unsaved, saving or failed work stays. If the read is newer, the save
  // answers as a conflict and the person chooses to reload.
  if (saveStatus !== 'saved') return false;
  // Settled: only a newer stored revision; an echo of this store's own save,
  // or an older read, changes nothing.
  return next.revision > savedRevision;
}

/**
 * Everything one dashboard needs beneath it: the read, the host's choices, the
 * clock, the store and its saves. It renders no layout, so a host can put its
 * own frame (a resource view with a contextual panel) between the provider and
 * the parts that read the store.
 *
 * **A read replaces the store only when the dashboard changed.** Hosts read
 * again for reasons of their own, so a new snapshot replaces the store only
 * for another dashboard or storage, after a conflict once the person has
 * chosen Reload, or when nothing is waiting to be saved and the snapshot's
 * revision is newer than the store's. Otherwise the store, with any unsaved,
 * in-flight, failed or conflicted edit, stays as it is. A replacement is never a remount: the children stay
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
  unavailableKinds,
  unloadedKinds,
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
   * The dashboard as the host already has it. A new one with a higher
   * revision replaces the store once nothing is waiting to be saved; the same
   * revision as new objects changes nothing. Keep `storage` stable: a
   * different storage replaces the store.
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
  /** The kinds of record the host could not read; their link widgets show a failure. @default [] */
  unavailableKinds?: readonly DashboardLinkItem['kind'][];
  /** The kinds of record the host did not read; widgets added later that need them load after the next save. @default [] */
  unloadedKinds?: readonly DashboardLinkItem['kind'][];
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
  // The store whose conflicted draft the person gave up by choosing Reload.
  const [givenUp, setGivenUp] = useState<StoreApi<DashboardStore> | null>(null);
  if (
    source &&
    active &&
    !sameSource(active.source, source) &&
    !replaces(active, source, givenUp)
  ) {
    // The same dashboard read again: keep the store and what it holds.
    setActive({ source, store: active.store });
  } else if (source && (!active || !sameSource(active.source, source))) {
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
        revision: source.revision,
      }),
    });
  }
  const ready = active && source && sameSource(active.source, source);

  // Follows the store, not each read: a read the store keeps must not
  // disconnect its saves (disconnecting flushes, and forgets what is in flight).
  const store = active?.store;
  const saveTo = active?.source.storage;
  const saveId = active?.source.dashboardId;
  useEffect(() => {
    if (!store || !saveTo || saveId === undefined || readOnly) return;
    return connectSaves(store, saveTo, saveId);
  }, [store, saveTo, saveId, readOnly]);

  if (!snapshot && current?.state === 'failed') {
    return <>{failureFallback}</>;
  }
  if (!ready || !active) return <>{fallback}</>;

  return (
    <TooltipProvider>
      <DashboardConfigProvider
        items={items}
        unavailableKinds={unavailableKinds}
        unloadedKinds={unloadedKinds}
        widgetTypes={widgetTypes}
        persistsStatus={persistsStatus}
        LinkComponent={LinkComponent}
        onReload={() => {
          // Only Reload after a conflict gives the draft up; the next read of
          // this dashboard then replaces the store.
          if (active.store.getState().saveStatus === 'conflict') {
            setGivenUp(active.store);
          }
          if (onReload) onReload();
          else setReloads((count) => count + 1);
        }}
      >
        <DashboardStoreScope store={active.store}>
          <LinkItemsLoader />
          <ClockProvider now={now ?? DEFAULT_NOW}>{children}</ClockProvider>
        </DashboardStoreScope>
      </DashboardConfigProvider>
    </TooltipProvider>
  );
}
