import type { WidgetType } from '@synapcity/domain-dashboards';

import type { DashboardLinkItem } from '../../../contracts';
import { useDashboardConfig } from '../../config';
import { WidgetEmpty, WidgetFailed, WidgetLoading } from '../widget-states';

type LinkWidgetType = Extract<WidgetType, 'pinned' | 'last-opened' | 'spaces'>;

const KIND_LABEL: Record<DashboardLinkItem['kind'], string> = {
  space: 'Space',
  document: 'Document',
  dashboard: 'Dashboard',
};

const EMPTY: Record<LinkWidgetType, string> = {
  pinned: 'Nothing is pinned yet.',
  'last-opened':
    'Nothing opened yet. Spaces and dashboards appear here once you open them.',
  spaces: 'No Spaces yet.',
};

const byTimeDescending =
  (field: 'pinnedAt' | 'lastViewedAt') =>
  (a: DashboardLinkItem, b: DashboardLinkItem) =>
    Date.parse(b[field] ?? '') - Date.parse(a[field] ?? '');

/**
 * What a link widget shows, from the host's items: pinned records newest pin
 * first, records by last opened, or the Spaces in the order given. The query
 * describes what to select, never one record.
 */
export function selectLinkItems(
  type: LinkWidgetType,
  items: readonly DashboardLinkItem[],
  limit: number,
): DashboardLinkItem[] {
  const chosen =
    type === 'pinned'
      ? items.filter((i) => i.pinnedAt).sort(byTimeDescending('pinnedAt'))
      : type === 'last-opened'
        ? items
            .filter((i) => i.lastViewedAt)
            .sort(byTimeDescending('lastViewedAt'))
        : items.filter((i) => i.kind === 'space');
  return chosen.slice(0, limit);
}

/** The kinds of record a link widget lists: Spaces only for Spaces, every kind otherwise. */
export function kindsListedBy(
  type: LinkWidgetType,
): readonly DashboardLinkItem['kind'][] {
  return type === 'spaces' ? ['space'] : ['space', 'document', 'dashboard'];
}

/**
 * Whether a widget lists a kind of record the host could not read. Spaces
 * lists Spaces only; Pinned and Last opened list every kind, so any failed
 * source makes them incomplete.
 */
function isDegraded(
  type: LinkWidgetType,
  unavailable: readonly DashboardLinkItem['kind'][],
): boolean {
  return type === 'spaces'
    ? unavailable.includes('space')
    : unavailable.length > 0;
}

/** The body of the Pinned, Last opened and Spaces widgets: a short list of links. */
export function LinkBody({
  type,
  limit,
}: {
  type: LinkWidgetType;
  limit: number;
}) {
  const { items, unavailableKinds, unloadedKinds, onReload, LinkComponent } =
    useDashboardConfig();
  if (isDegraded(type, unavailableKinds)) {
    return <WidgetFailed onRetry={onReload} />;
  }
  // Records the host has not read yet: not "nothing pinned", just not here yet.
  if (kindsListedBy(type).some((kind) => unloadedKinds.includes(kind))) {
    return <WidgetLoading />;
  }
  const shown = selectLinkItems(type, items, limit);
  if (shown.length === 0) return <WidgetEmpty>{EMPTY[type]}</WidgetEmpty>;
  return (
    <ul className="m-0 flex list-none flex-col p-0">
      {shown.map((item) => (
        <li
          key={`${item.kind}:${item.id}`}
          className="flex items-baseline justify-between gap-2 border-b border-divider py-1.5"
        >
          {item.href ? (
            <LinkComponent
              href={item.href}
              className="truncate text-sm text-foreground underline-offset-4 hover:underline focus-visible:underline"
            >
              {item.name}
            </LinkComponent>
          ) : (
            <span className="truncate text-sm text-foreground">
              {item.name}
            </span>
          )}
          <span className="shrink-0 text-xs text-muted-foreground">
            {KIND_LABEL[item.kind]}
          </span>
        </li>
      ))}
    </ul>
  );
}
