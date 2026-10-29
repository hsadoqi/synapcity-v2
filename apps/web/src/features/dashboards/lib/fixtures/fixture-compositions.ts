import {
  createComposition,
  layoutsForWidgets,
  type DashboardComposition,
  type Widget,
} from '@synapcity/domain-dashboards';

type LinkWidget = Extract<
  Widget,
  { type: 'pinned' | 'last-opened' | 'spaces' }
>;

const TITLES: Record<LinkWidget['type'], string> = {
  pinned: 'Pinned',
  'last-opened': 'Last opened',
  spaces: 'Spaces',
};

/** Fixture dashboards that open populated, and the link widgets each shows, in order. */
const SEEDS: Readonly<Record<string, readonly LinkWidget['type'][]>> = {
  'fixture-dashboard-project-status': ['pinned', 'last-opened', 'spaces'],
  'fixture-dashboard-word-count': ['last-opened', 'pinned'],
  'fixture-dashboard-weekly-plan': ['spaces'],
};

/**
 * What a fixture dashboard shows when this browser has nothing saved for it:
 * sample content for development fixture mode, so the first open can be
 * judged. A read-time default only; it is never written. The first edit saves
 * the whole composition through the normal save path. `null` means no seed:
 * the dashboard opens empty (`fixture-dashboard-reading-progress` stays empty,
 * because the editing e2e tests start from its empty state).
 */
export function fixtureComposition(
  dashboardId: string,
): DashboardComposition | null {
  const types = SEEDS[dashboardId];
  if (!types) return null;
  const base = createComposition();
  const widgets: Widget[] = types.map((type, index) => ({
    // Stable ids, so a reload shows the same widgets.
    id: `wgt-fixture-${dashboardId}-${index}`,
    type,
    title: TITLES[type],
    collapsed: false,
    highlight: 'none',
    status: 'active',
    query: { limit: 6 },
  }));
  return {
    ...base,
    widgets,
    layouts: layoutsForWidgets(widgets, base.settings),
  };
}
