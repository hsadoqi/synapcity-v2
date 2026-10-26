'use client';

import { useMemo } from 'react';
import { LayoutDashboard } from 'lucide-react';

import {
  CollectionIndex,
  type SetPinnedResult,
} from '@synapcity/frontend-collection';
import type {
  CollectionItem,
  CollectionItemAction,
} from '@synapcity/frontend-collection';

import type { DashboardSummary } from '@synapcity/domain-dashboards';

import type { SetDashboardPinnedResult } from '../../../contracts';
import { toCollectionItem } from '../../utils/collection-item';
import { DashboardPreview } from '../dashboard-preview';

interface DashboardsIndexProps {
  dashboards: DashboardSummary[];
  homePath: string;
  /** The moment the page was rendered, so server and browser label dates alike. */
  now: string;
  setDashboardPinned: (
    dashboardId: string,
    pinned: boolean,
  ) => Promise<SetDashboardPinnedResult>;
  signInHref?: string;
}

const LABELS = { singular: 'dashboard', plural: 'Dashboards' };

/** Only open and pin work for now; rename, duplicate and delete have no flow yet. */
const DASHBOARD_ACTIONS: CollectionItemAction[] = ['open', 'toggle-pin'];

const EMPTY_STATE = {
  title: 'No dashboards yet',
  description:
    'A dashboard lays your work out side by side. Everything you build shows up here, in a space or not.',
};

/** The dashboards index: the shared browse page, filled with dashboards. */
export function DashboardsIndex({
  dashboards,
  homePath,
  now,
  setDashboardPinned,
  signInHref,
}: DashboardsIndexProps) {
  const items = useMemo<CollectionItem[]>(
    () => dashboards.map((record) => toCollectionItem(record, homePath)),
    [dashboards, homePath],
  );

  return (
    <CollectionIndex
      items={items}
      now={now}
      labels={LABELS}
      icon={LayoutDashboard}
      heading="All dashboards"
      recentHeading="Recently used"
      pinnedHeading="Pinned"
      pinnedEmptyMessage="Pin a dashboard from its menu to keep it here."
      emptyState={EMPTY_STATE}
      actions={DASHBOARD_ACTIONS}
      renderPreview={(item) => <DashboardPreview item={item} />}
      onSetPinned={async (id, pinned): Promise<SetPinnedResult> => {
        const result = await setDashboardPinned(id, pinned);
        return result.ok
          ? { ok: true }
          : { ok: false, error: result.error, signedOut: result.signedOut };
      }}
      signInHref={signInHref}
    />
  );
}
