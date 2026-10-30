import {
  createComposition,
  dashboardCompositionSchema,
  type DashboardComposition,
  layoutsForWidgets,
  type Widget,
} from '@synapcity/domain-dashboards';

import type { Scenario } from './scenario';

/*
 * A scenario as SQL for the local database: its Spaces, Documents and
 * Dashboards, then where they are filed (`space_documents`, `space_dashboards`).
 * The statements carry the scenario's own ids and timestamps, which survive
 * because the `updated_at` and user-state triggers only fire on UPDATE. A
 * Dashboard's composition is created by its insert trigger; this file then
 * fills it with query widgets (pinned, last opened, spaces, feed, calendar,
 * agenda). Those select the owner's own records, so they show this scenario's
 * data and point at nothing that has to exist.
 *
 * The owner is not in the text. Every row is written for the psql variable
 * `owner_id`, so the loader can create the real Auth user first and pass its
 * id with `psql -v owner_id=<uuid>`. Run it as the database administrator
 * (RLS does not apply), on a disposable local database only.
 */

/** A SQL string literal; the only characters that need care are quotes. */
function text(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

function nullableText(value: string | null | undefined): string {
  return value === null || value === undefined ? 'null' : text(value);
}

function textArray(values: string[]): string {
  return values.length === 0
    ? "'{}'::text[]"
    : `array[${values.map(text).join(', ')}]::text[]`;
}

type Row = {
  id: string;
  name: string;
  description?: string | undefined;
  icon: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  pinnedAt: string | null;
  lastViewedAt: string | null;
};

function insertRows(table: string, rows: Row[]): string {
  if (rows.length === 0) return '';
  const values = rows.map(
    (r) =>
      `  (${text(r.id)}, :'owner_id', ${text(r.name)}, ${nullableText(r.description)}, ${text(r.icon)}, ${textArray(r.tags)}, ${text(r.createdAt)}, ${text(r.updatedAt)}, ${nullableText(r.pinnedAt)}, ${nullableText(r.lastViewedAt)})`,
  );
  return `insert into public.${table}
  (id, owner_id, name, description, icon, tags, created_at, updated_at, pinned_at, last_viewed_at)
values
${values.join(',\n')};
`;
}

/** Widgets that select the owner's data; none points at a record. */
const QUERY_WIDGETS = [
  { type: 'pinned', title: 'Pinned', query: { limit: 6 } },
  { type: 'last-opened', title: 'Recently opened', query: { limit: 6 } },
  { type: 'spaces', title: 'Spaces', query: { limit: 6 } },
  { type: 'feed', title: 'Recent activity', query: { limit: 6 } },
  { type: 'calendar', title: 'This week', query: { range: 'week' } },
  { type: 'agenda', title: 'Today', query: { range: 'day' } },
] as const;

/** A parsed composition: three to five of the query widgets, chosen by the id. */
function compositionFor(dashboardId: string): DashboardComposition {
  const seed = parseInt(dashboardId.slice(0, 8), 16);
  const count = 3 + (seed % 3);
  // Start inside the first three (the ones that list the owner's records), so
  // every dashboard shows at least one widget with real rows.
  const start = seed % 3;
  const widgets = Array.from({ length: count }, (_, i) => {
    const template = QUERY_WIDGETS[(start + i) % QUERY_WIDGETS.length]!;
    return {
      ...template,
      id: `wgt_${dashboardId.slice(0, 8)}_${i + 1}`,
      collapsed: false,
      highlight: i === 0 ? 'accent' : 'none',
      status: 'active',
    } as Widget;
  });
  const { settings } = createComposition();
  return dashboardCompositionSchema.parse({
    settings,
    widgets,
    layouts: layoutsForWidgets(widgets, settings),
  });
}

/**
 * The compositions `scenarioToSql` writes, by Dashboard id, so a preview can
 * show exactly what the seeded database holds.
 */
export function demoCompositions(
  scenario: Scenario,
): Record<string, DashboardComposition> {
  return Object.fromEntries(
    scenario.dashboards.map((d) => [d.id, compositionFor(d.id)]),
  );
}

export function scenarioToSql(scenario: Scenario): string {
  const filed = (kind: 'document' | 'dashboard') =>
    scenario.memberships.filter((m) => m.kind === kind);
  const edges = (
    table: string,
    column: string,
    kind: 'document' | 'dashboard',
  ) => {
    const rows = filed(kind).map(
      (m) => `  (${text(m.spaceId)}, ${text(m.itemId)}, :'owner_id')`,
    );
    return rows.length === 0
      ? ''
      : `insert into public.${table} (space_id, ${column}, owner_id)
values
${rows.join(',\n')};
`;
  };

  return [
    `-- Generated from the "${scenario.name}" scenario. Local development only.`,
    'begin;',
    insertRows('spaces', scenario.spaces),
    insertRows('documents', scenario.documents),
    insertRows('dashboards', scenario.dashboards),
    edges('space_documents', 'document_id', 'document'),
    edges('space_dashboards', 'dashboard_id', 'dashboard'),
    ...scenario.dashboards.map(
      (d) =>
        `update public.dashboard_compositions set composition = ${text(JSON.stringify(compositionFor(d.id)))}::jsonb, revision = revision + 1 where dashboard_id = ${text(d.id)};\n`,
    ),
    'commit;',
    '',
  ]
    .filter((part) => part !== '')
    .join('\n');
}
