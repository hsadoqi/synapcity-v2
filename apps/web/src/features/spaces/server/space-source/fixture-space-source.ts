import { baseRecordSchema } from '@synapcity/domain-records';
import type { BaseRecord } from '@synapcity/domain-records';

import { SPACE_FIXTURES, spaceItem } from '../../lib/fixtures';
import type { SpaceSource } from './space-source';

/** A sample document or dashboard as the base record the port returns. */
function asBaseRecord(
  item:
    | (typeof spaceItem.documents)[number]
    | (typeof spaceItem.dashboards)[number],
): BaseRecord {
  return baseRecordSchema.parse({
    id: item.id,
    ownerId:
      SPACE_FIXTURES[0]?.ownerId ?? '11111111-1111-4111-8111-111111111111',
    name: item.name,
    description: item.description,
    icon: item.icon,
    tags: [],
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  });
}

/**
 * Development fixtures (ADR-0006, development amendment). There is no session
 * or database, so nothing is saved, and the sample documents and dashboards
 * stand in for participation so the detail page can be built and browsed.
 */
export function fixtureSpaceSource(): SpaceSource {
  return {
    list: async () => [...SPACE_FIXTURES],
    listSummaries: async () =>
      SPACE_FIXTURES.map((space) => ({
        ...space,
        documentsTotal: 0,
        dashboardsTotal: 0,
      })),
    find: async (spaceId) =>
      SPACE_FIXTURES.find((space) => space.id === spaceId) ?? null,
    setPinned: async () => ({ ok: false, error: { code: 'fixture_mode' } }),
    recordView: async () => ({ ok: true }),
    listDocuments: async () => spaceItem.documents.map(asBaseRecord),
    listDashboards: async () => spaceItem.dashboards.map(asBaseRecord),
  };
}
