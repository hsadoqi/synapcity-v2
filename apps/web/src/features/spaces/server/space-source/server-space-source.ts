import {
  findSpace,
  listSpaceDashboards,
  listSpaceDocuments,
  listSpaces,
  listSpaceSummaries,
  recordSpaceView,
  setSpacePinned,
} from '@synapcity/server-data';
import type { SupabaseServerClient } from '@synapcity/server-supabase';

import type { SpaceSource } from './space-source';

/** The real source: every method reads or writes through the request's client. */
export function serverSpaceSource(client: SupabaseServerClient): SpaceSource {
  return {
    list: () => listSpaces(client),
    listSummaries: () => listSpaceSummaries(client),
    find: (spaceId) => findSpace(client, spaceId),
    setPinned: (spaceId, pinned) => setSpacePinned(client, spaceId, pinned),
    recordView: (spaceId) => recordSpaceView(client, spaceId, new Date()),
    listDocuments: (spaceId) => listSpaceDocuments(client, spaceId),
    listDashboards: (spaceId) => listSpaceDashboards(client, spaceId),
  };
}
