import type { BaseRecord } from '@synapcity/domain-records';

import { getDashboards } from '@/features/dashboards/server/get-dashboards';
import { getDocuments } from '@/features/documents/server/get-documents';
import { byLatest } from '@/lib/sidebar-records';
import { getSpaceSource } from '@/lib/spaces';

import type { PlaygroundSidebarContext } from './main-sidebar';

/** The items of `ids` that the caller can see, in the order of `ids`. */
function itemsIn(
  ids: readonly string[],
  byId: ReadonlyMap<string, BaseRecord>,
) {
  return ids.flatMap((id) => {
    const item = byId.get(id);
    return item ? [item] : [];
  });
}

/**
 * Every Space with the documents and dashboards taking part in it, for the
 * playground's two-level sidebar. Three reads however many Spaces there are:
 * the Spaces with their participation rows (`listWithRelations`), then the
 * owner's documents and their dashboards, joined in memory. Spaces come in the
 * navigation order (pinned first, then the most recently changed); items keep
 * the newest addition first. A participation row whose item the caller cannot
 * see is skipped, as the per-Space reads did.
 */
export async function loadPlaygroundContexts(): Promise<
  PlaygroundSidebarContext[]
> {
  const source = await getSpaceSource();
  const [spaces, documents, dashboards] = await Promise.all([
    source.listWithRelations(),
    getDocuments(),
    getDashboards(),
  ]);
  const documentsById = new Map(documents.map((d) => [d.id, d] as const));
  const dashboardsById = new Map(dashboards.map((d) => [d.id, d] as const));

  return [...spaces].sort(byLatest).map((space) => ({
    id: space.id,
    label: space.name,
    icon: space.icon,
    groups: [
      {
        id: 'documents',
        label: 'Documents',
        items: itemsIn(
          space.space_documents.map((link) => link.document_id),
          documentsById,
        ).map((document) => ({
          id: document.id,
          label: document.name,
          icon: document.icon ?? 'file-text',
        })),
        empty: 'No documents in this space',
      },
      {
        id: 'dashboards',
        label: 'Dashboards',
        items: itemsIn(
          space.space_dashboards.map((link) => link.dashboard_id),
          dashboardsById,
        ).map((dashboard) => ({
          id: dashboard.id,
          label: dashboard.name,
          icon: dashboard.icon ?? 'layout-dashboard',
        })),
        empty: 'No dashboards in this space',
      },
    ],
  }));
}
