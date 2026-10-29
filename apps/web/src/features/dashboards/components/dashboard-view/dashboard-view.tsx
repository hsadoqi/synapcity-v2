'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import {
  LINK_WIDGET_TYPES,
  type DashboardComposition,
} from '@synapcity/domain-dashboards';
import type { BaseRecord } from '@synapcity/domain-records';
import type { DashboardLinkItem } from '@synapcity/features-dashboards/contracts';
import {
  browserDashboardStorage,
  DashboardWorkspace,
} from '@synapcity/features-dashboards/frontend';
import { EntityIcon } from '@synapcity/frontend-collection';
import { ResourceFrame, ResourceHeader } from '@synapcity/frontend-shells';

import { RESOURCE_PANEL } from '@/components/resource-panel';

import { saveDashboardComposition } from '../../server/actions/dashboard-composition-actions';
import { serverDashboardStorage } from '../../lib/server-dashboard-storage';

/**
 * Where this dashboard's composition lives: the database through Server
 * Actions, or, in development fixture mode (no session, no database), this
 * browser, so editing can still be tried.
 */
export type DashboardPersistence = 'server' | 'browser';

/**
 * One dashboard, editable: its canvas lays out at the breakpoint its own
 * width calls for (so it follows the contextual panel beside it), saves
 * through the server adapter and says where the save stands. After a
 * conflict, Reload asks the server again by refreshing the page, which hands
 * the canvas a fresh snapshot.
 */
export function DashboardView({
  dashboard,
  composition,
  revision,
  items,
  persistence,
}: {
  dashboard: BaseRecord;
  composition: DashboardComposition | null;
  revision: number;
  items: readonly DashboardLinkItem[];
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
        : browserDashboardStorage({ ownerId }),
    [persistence, composition, revision, ownerId],
  );

  return (
    <ResourceFrame
      label={dashboard.name}
      header={
        <ResourceHeader
          title={dashboard.name}
          icon={<EntityIcon name={dashboard.icon} className="size-4" />}
        />
      }
      destinations={RESOURCE_PANEL}
      scroll={false}
    >
      <DashboardWorkspace
        dashboardId={dashboard.id}
        ownerId={ownerId}
        storage={storage}
        items={items}
        widgetTypes={LINK_WIDGET_TYPES}
        persistsStatus={false}
        LinkComponent={Link}
        onReload={() => router.refresh()}
      />
    </ResourceFrame>
  );
}
