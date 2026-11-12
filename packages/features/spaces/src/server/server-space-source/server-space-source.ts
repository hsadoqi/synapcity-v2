import {
  addSpaceDashboard,
  addSpaceDocument,
  createRecord,
  findSpace,
  getSpaceRelations,
  listLatestSpaces,
  listSpaceDashboards,
  listSpaceDocuments,
  listSpaceNavItems,
  listSpaces,
  listSpacesWithRelations,
  listSpaceSummaries,
  recordSpaceView,
  setSpacePinned,
  type SpaceRelationType,
} from '@synapcity/server-data';
import type { SupabaseServerClient } from '@synapcity/server-supabase';

import type { SpaceItemLink, SpaceSource } from '../types';

/** A participation row as the port reports it: the item and its per-Space presentation. */
function itemLink(
  itemId: string,
  row: { pinned: boolean; position: number | null; added_at: string },
): SpaceItemLink {
  return {
    itemId,
    pinned: row.pinned,
    position: row.position,
    addedAt: row.added_at,
  };
}

/** The real source: every method reads or writes through the request's client. */
export function serverSpaceSource(client: SupabaseServerClient): SpaceSource {
  return {
    list: () => listSpaces(client),
    listSummaries: () => listSpaceSummaries(client),
    listLatest: (limit) => listLatestSpaces(client, limit),
    listNavItems: () => listSpaceNavItems(client),
    listWithRelations: async () =>
      (await listSpacesWithRelations(client)).map(
        ({ space_documents, space_dashboards, ...space }) => ({
          ...space,
          documentLinks: space_documents.map((row) =>
            itemLink(row.document_id, row),
          ),
          dashboardLinks: space_dashboards.map((row) =>
            itemLink(row.dashboard_id, row),
          ),
        }),
      ),
    // An arrow cannot be checked against overloads; `getSpaceRelations`'s own
    // overloads are what match each kind to its result.
    getRelations: ((spaceId: string, type?: SpaceRelationType) =>
      getSpaceRelations(client, spaceId, type)) as SpaceSource['getRelations'],
    find: (spaceId) => findSpace(client, spaceId),
    create: (input) => createRecord(client, 'spaces', input),
    setPinned: (spaceId, pinned) => setSpacePinned(client, spaceId, pinned),
    recordView: (spaceId) => recordSpaceView(client, spaceId, new Date()),
    listDocuments: (spaceId) => listSpaceDocuments(client, spaceId),
    listDashboards: (spaceId) => listSpaceDashboards(client, spaceId),
    addDocument: (spaceId, documentId) =>
      addSpaceDocument(client, spaceId, documentId),
    addDashboard: (spaceId, dashboardId) =>
      addSpaceDashboard(client, spaceId, dashboardId),
  };
}
