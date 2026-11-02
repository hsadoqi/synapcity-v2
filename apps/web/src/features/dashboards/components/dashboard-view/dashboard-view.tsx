'use client';

import { useRouter } from 'next/navigation';
import { useMemo, type ReactNode } from 'react';
import {
  LINK_WIDGET_TYPES,
  type DashboardComposition,
} from '@synapcity/domain-dashboards';
import type { BaseRecord } from '@synapcity/domain-records';
import type {
  DashboardLinkItem,
  DashboardSnapshot,
  DashboardStorage,
} from '@synapcity/features-dashboards/contracts';
import {
  browserDashboardStorage,
  DashboardEditorSurface,
  DashboardWorkspaceProvider,
  DashboardWorkspaceSkeleton,
  LiveAnnouncer,
} from '@synapcity/features-dashboards/frontend';
import { EntityIcon } from '@synapcity/frontend-collection';
import {
  ResourceFrame,
  ResourceHeader,
  useContextualPanel,
} from '@synapcity/frontend-shells';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@synapcity/frontend-ui/core/alert';

import { saveDashboardComposition } from '../../server/actions/dashboard-composition-actions';
import { fixtureComposition } from '../../lib/fixtures';
import { serverDashboardStorage } from '../../lib/server-dashboard-storage';
import { DASHBOARD_PANEL, WIDGETS_DESTINATION_ID } from '../dashboard-panel';
import { LinkButton } from '@synapcity/frontend-ui/next/link-button';

/**
 * Where this dashboard's composition lives: the database through Server
 * Actions, or, in development fixture mode (no session, no database), this
 * browser, so editing can still be tried.
 */
export type DashboardPersistence = 'server' | 'browser';

/**
 * Fixture mode only: a dashboard with nothing saved in this browser reads as
 * its fixture seed, if it has one. The seed is a read-time default and is not
 * written; the first edit saves through the usual scheduler. Anything saved,
 * an empty dashboard included, wins over the seed.
 */
function withFixtureSeeds(storage: DashboardStorage): DashboardStorage {
  return {
    ...storage,
    load: async (dashboardId) => {
      const saved = await storage.load(dashboardId);
      if (saved.composition !== null) return saved;
      return { ...saved, composition: fixtureComposition(dashboardId) };
    },
  };
}

/**
 * The canvas inside the frame. It is the only place that knows both owners:
 * the panel's controls (it sits beneath the shell) and the Dashboard store
 * (through the surface). Edit layout asks for the palette; this opens the
 * Widgets destination. Nothing flows the other way: closing or switching the
 * panel never reaches the store.
 */
function DashboardBody() {
  const panel = useContextualPanel();
  return (
    <DashboardEditorSurface
      // The live region lives outside the frame, where a narrow panel's
      // `inert` main region cannot silence it.
      announce={false}
      onOpenPalette={() => panel?.open(WIDGETS_DESTINATION_ID)}
    />
  );
}

/** The frame without a destination: while the dashboard is read, or when it could not be. */
function PlainFrame({
  dashboard,
  children,
}: {
  dashboard: BaseRecord;
  children: ReactNode;
}) {
  return (
    <ResourceFrame
      label={dashboard.name}
      header={
        <ResourceHeader
          title={dashboard.name}
          icon={<EntityIcon name={dashboard.icon} className="size-4" />}
        />
      }
      scroll={false}
    >
      {children}
    </ResourceFrame>
  );
}

/**
 * One dashboard, editable: provider, then frame, then canvas. The Dashboard
 * store sits above the frame so the Widgets destination, which the frame's
 * panel shows, can read it, and a Reload after a conflict replaces the store
 * without remounting the frame (the panel stays as it was). In server mode
 * the page already holds the composition, so the first render has the frame,
 * the rail and the canvas; in the browser fixture mode the frame shows a
 * skeleton while the browser storage is read.
 */
export function DashboardView({
  dashboard,
  composition,
  revision,
  items,
  unavailableKinds = [],
  unloadedKinds = [],
  persistence,
}: {
  dashboard: BaseRecord;
  composition: DashboardComposition | null;
  revision: number;
  items: readonly DashboardLinkItem[];
  /** Kinds of record that could not be read; their link widgets show a failure. */
  unavailableKinds?: readonly DashboardLinkItem['kind'][];
  /** Kinds of record not read yet; widgets that need them load after the next save. */
  unloadedKinds?: readonly DashboardLinkItem['kind'][];
  persistence: DashboardPersistence;
}) {
  const router = useRouter();
  const ownerId = dashboard.ownerId;
  const storage = useMemo(
    () =>
      persistence === 'server'
        ? serverDashboardStorage({
            composition,
            revision,
            save: saveDashboardComposition,
          })
        : withFixtureSeeds(browserDashboardStorage({ ownerId })),
    [persistence, composition, revision, ownerId],
  );
  // Stable between renders: a different snapshot replaces the store.
  const snapshot = useMemo<DashboardSnapshot | undefined>(
    () =>
      persistence === 'server'
        ? { composition, records: null, revision }
        : undefined,
    [persistence, composition, revision],
  );

  return (
    <DashboardWorkspaceProvider
      dashboardId={dashboard.id}
      ownerId={ownerId}
      storage={storage}
      snapshot={snapshot}
      items={items}
      unavailableKinds={unavailableKinds}
      unloadedKinds={unloadedKinds}
      widgetTypes={LINK_WIDGET_TYPES}
      persistsStatus={false}
      LinkComponent={LinkButton}
      onReload={() => router.refresh()}
      fallback={
        <PlainFrame dashboard={dashboard}>
          <DashboardWorkspaceSkeleton />
        </PlainFrame>
      }
      failureFallback={
        <PlainFrame dashboard={dashboard}>
          <Alert variant="destructive">
            <AlertTitle>This dashboard could not be loaded.</AlertTitle>
            <AlertDescription>
              Nothing was changed. Reload the page to try again.
            </AlertDescription>
          </Alert>
        </PlainFrame>
      }
    >
      <LiveAnnouncer />
      <ResourceFrame
        label={dashboard.name}
        header={
          <ResourceHeader
            title={dashboard.name}
            icon={<EntityIcon name={dashboard.icon} className="size-4" />}
          />
        }
        destinations={DASHBOARD_PANEL}
        scroll={false}
      >
        <DashboardBody />
      </ResourceFrame>
    </DashboardWorkspaceProvider>
  );
}
