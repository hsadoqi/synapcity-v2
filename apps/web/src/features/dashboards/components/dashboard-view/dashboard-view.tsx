'use client';

import { useMemo } from 'react';
import type { BaseRecord } from '@synapcity/domain-records';
import {
  browserDashboardStorage,
  DashboardWorkspace,
} from '@synapcity/features-dashboards/frontend';
import { EntityIcon } from '@synapcity/frontend-collection';
import { ResourceFrame, ResourceHeader } from '@synapcity/frontend-shells';

import { RESOURCE_PANEL } from '@/components/resource-panel';

/**
 * One dashboard, read-only: its canvas lays out at the breakpoint its own
 * width calls for, so it follows the contextual panel beside it. The canvas
 * reads what this browser holds and saves nothing: server storage for
 * dashboards is not built yet, so editing is not offered.
 */
export function DashboardView({ dashboard }: { dashboard: BaseRecord }) {
  const storage = useMemo(
    () => browserDashboardStorage({ ownerId: dashboard.ownerId }),
    [dashboard.ownerId],
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
        ownerId={dashboard.ownerId}
        storage={storage}
        readOnly
      />
    </ResourceFrame>
  );
}
