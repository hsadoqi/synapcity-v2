import type { SpaceSource } from '@synapcity/features-spaces/server';
import type { SpaceEntity } from '@synapcity/domain-spaces';
import type { SpaceRelationType } from '@synapcity/server-data';

import { DEMO_DASHBOARDS, DEMO_DOCUMENTS, DEMO_SPACES } from './demo-spaces';

/** Pinned first (most recently pinned on top), then most recently changed. */
function byNavOrder(a: SpaceEntity, b: SpaceEntity) {
  if (Boolean(a.pinnedAt) !== Boolean(b.pinnedAt)) return a.pinnedAt ? -1 : 1;
  if (a.pinnedAt && b.pinnedAt && a.pinnedAt !== b.pinnedAt) {
    return a.pinnedAt < b.pinnedAt ? 1 : -1;
  }
  return b.updatedAt.localeCompare(a.updatedAt);
}

/**
 * A sample Space's participation rows: none, as the samples have no
 * participation data (their counts are zero too). Only the kind asked for.
 */
function emptyRelations(space: SpaceEntity, type?: SpaceRelationType) {
  return {
    ...space,
    ...(type !== 'dashboards' && { space_documents: [] }),
    ...(type !== 'documents' && { space_dashboards: [] }),
  };
}

/**
 * Development fixtures (ADR-0006, development amendment). There is no session
 * or database, so nothing is saved, and the sample documents and dashboards
 * stand in for participation so the detail page can be built and browsed.
 */
export function fixtureSpaceSource(): SpaceSource {
  return {
    list: async () => [...DEMO_SPACES],
    listSummaries: async () =>
      DEMO_SPACES.map((space) => ({
        ...space,
        documentsTotal: 0,
        dashboardsTotal: 0,
      })),
    listNavItems: async () =>
      [...DEMO_SPACES]
        .sort(byNavOrder)
        .map(({ id, name, description, icon, tags, updatedAt }) => ({
          id,
          name,
          description,
          icon,
          tags,
          updatedAt,
        })),
    listWithRelations: async () =>
      DEMO_SPACES.map((space) => ({
        ...space,
        space_documents: [],
        space_dashboards: [],
      })),
    // An arrow cannot be checked against overloads; the shape follows `type`.
    getRelations: (async (spaceId: string, type?: SpaceRelationType) => {
      const space = DEMO_SPACES.find((candidate) => candidate.id === spaceId);
      return space ? emptyRelations(space, type) : null;
    }) as SpaceSource['getRelations'],
    find: async (spaceId) =>
      DEMO_SPACES.find((space) => space.id === spaceId) ?? null,
    create: async () => ({ ok: false, error: { code: 'fixture_mode' } }),
    setPinned: async () => ({ ok: false, error: { code: 'fixture_mode' } }),
    recordView: async () => ({ ok: true }),
    listDocuments: async () => [...DEMO_DOCUMENTS],
    listDashboards: async () => [...DEMO_DASHBOARDS],
    addDocument: async () => ({ ok: false, error: { code: 'fixture_mode' } }),
    addDashboard: async () => ({ ok: false, error: { code: 'fixture_mode' } }),
  };
}
