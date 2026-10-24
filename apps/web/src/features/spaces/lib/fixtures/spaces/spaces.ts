import { DEMO_SPACES } from '@/lib/demo/space-source';

import type {
  Space,
  SpaceEntityItemKind,
} from '@synapcity/features-spaces/contracts';

const spaceItem = {
  kind: 'space' as const,
  createdAt: DEMO_SPACES[0]?.createdAt ?? new Date().toISOString(),
  updatedAt: DEMO_SPACES[0]?.updatedAt ?? new Date().toISOString(),
  id: DEMO_SPACES[0]?.id ?? 'fixture-space',
  name: DEMO_SPACES[0]?.name ?? 'Untitled Space',
  icon: DEMO_SPACES[0]?.icon ?? 'folder',
  description: DEMO_SPACES[0]?.description ?? 'No description provided.',
  tags: DEMO_SPACES[0]?.tags ?? [],
  pinnedAt: DEMO_SPACES[0]?.pinnedAt ?? null,
  lastViewedAt: DEMO_SPACES[0]?.lastViewedAt ?? null,
  documents: [
    {
      id: 'doc1',
      name: 'Document 1',
      description: 'This is the first document.',
      updatedAt: '2026-10-05T08:00:00Z',
      createdAt: '2026-10-05T08:00:00Z',
      icon: 'document',
      kind: 'document' as SpaceEntityItemKind,
    },
    {
      id: 'doc2',
      name: 'Document 2',
      updatedAt: '2026-10-05T08:00:00Z',
      createdAt: '2026-10-05T08:00:00Z',
      icon: 'document',
      kind: 'document' as SpaceEntityItemKind,
    },
  ],
  dashboards: [
    {
      id: 'dash1',
      name: 'Dashboard 1',
      description: 'This is the first dashboard.',
      updatedAt: '2026-10-05T08:00:00Z',
      createdAt: '2026-10-05T08:00:00Z',
      icon: 'boxes',
      kind: 'dashboard' as SpaceEntityItemKind,
    },
    {
      id: 'dash2',
      name: 'Dashboard 2',
      description: 'This is the second dashboard.',
      updatedAt: '2026-10-05T08:00:00Z',
      createdAt: '2026-10-05T08:00:00Z',
      icon: 'boxes',
      kind: 'dashboard' as SpaceEntityItemKind,
    },
  ],
  documentsTotal: 2,
  dashboardsTotal: 2,
};

export function createSpaceFixture(
  overrides: Partial<Space> & { ownerId?: string } = {},
): Space {
  return {
    ...spaceItem,
    ...overrides,
    documents: overrides.documents ?? spaceItem.documents ?? [],
    dashboards: overrides.dashboards ?? spaceItem.dashboards ?? [],
    documentsTotal:
      overrides.documentsTotal ??
      spaceItem.documentsTotal ??
      overrides.documents?.length ??
      spaceItem.documents.length ??
      0,
    dashboardsTotal:
      overrides.dashboardsTotal ??
      spaceItem.dashboardsTotal ??
      overrides.dashboards?.length ??
      spaceItem.dashboards.length ??
      0,
    ownerId: overrides.ownerId ?? '11111111-1111-4111-8111-111111111111',
  };
}
