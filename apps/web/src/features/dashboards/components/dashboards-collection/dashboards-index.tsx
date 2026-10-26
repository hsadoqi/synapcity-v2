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
import type { OwnedRecordSummary } from '@/lib/owned-records';
import { homePathFor, signInPathFor } from '@/lib/routing/user-paths';



interface DashboardsIndexProps {
  dashboards: OwnedRecordSummary[];
  userId: string;
  /** The moment the page was rendered, so server and browser label dates alike. */
  now: string;
}

const LABELS = { singular: 'dashboard', plural: 'Dashboards' };

/** Only open and pin work for now; rename, duplicate and delete have no flow yet. */
const DASHBOARD_ACTIONS: CollectionItemAction[] = ['open', 'toggle-pin'];

const EMPTY_STATE = {
  title: 'No dashboards yet',
  description:
    'A dashboard lays your work out side by side. Everything you build shows up here, in a space or not.',
};



async function saveDashboardPinned(
  id: string,
  pinned: boolean,
): Promise<SetPinnedResult> {
  const result = await setDashboardPinned(id, pinned);
  return result.ok
    ? { ok: true }
    : { ok: false, error: result.error, signedOut: result.signedOut };
}

/** The dashboards index: the shared browse page, filled with dashboards. */
export function DashboardsIndex({
  dashboards,
  userId,
  now,
}: DashboardsIndexProps) {
  const items = useMemo<CollectionItem[]>(
    () => dashboards.map((record) => toCollectionItem(record, userId)),
    [dashboards, userId],
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
      onSetPinned={saveDashboardPinned}
      signInHref={signInPathFor(`${homePathFor(userId)}/dashboards`)}
    />
  );
}
