import type { SpaceSource } from '@synapcity/features-spaces/server';

import { DEMO_DASHBOARDS, DEMO_DOCUMENTS, DEMO_SPACES } from './demo-spaces';

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
    find: async (spaceId) =>
      DEMO_SPACES.find((space) => space.id === spaceId) ?? null,
    create: async () => ({ ok: false, error: { code: 'fixture_mode' } }),
    setPinned: async () => ({ ok: false, error: { code: 'fixture_mode' } }),
    recordView: async () => ({ ok: true }),
    listDocuments: async () => [...DEMO_DOCUMENTS],
    listDashboards: async () => [...DEMO_DASHBOARDS],
  };
}
