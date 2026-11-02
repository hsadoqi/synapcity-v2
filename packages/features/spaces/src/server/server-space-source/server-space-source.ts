import {
  addSpaceDashboard,
  addSpaceDocument,
  createRecord,
  findSpace,
  getSpaceRelations,
  listSpaceDashboards,
  listSpaceDocuments,
  listSpaceNavItems,
  listSpaces,
  listSpacesWithRelations,
  listSpaceSummaries,
  recordSpaceView,
  setSpacePinned,
  type SpaceRelationType,
  //   listSpaceRelations,
  //   getSpaceRelations,
  //   addDocumentToSpace,
  //   addDashboardToSpace,
} from '@synapcity/server-data';
import type { SupabaseServerClient } from '@synapcity/server-supabase';

import type { SpaceSource } from '../types';

/** The real source: every method reads or writes through the request's client. */
export function serverSpaceSource(client: SupabaseServerClient): SpaceSource {
  return {
    list: () => listSpaces(client),
    listSummaries: () => listSpaceSummaries(client),
    listNavItems: () => listSpaceNavItems(client),
    listWithRelations: () => listSpacesWithRelations(client),
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
    // addDocument: (documentId) => addDocumentToSpace(SpacesIndex, documentId),
    addDocument: (spaceId, documentId) =>
      addSpaceDocument(client, spaceId, documentId),
    addDashboard: (spaceId, dashboardId) =>
      addSpaceDashboard(client, spaceId, dashboardId),
  };
}
