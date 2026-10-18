import { spaceSchema } from '../../../shared/schema';
import type {
  EntityKind,
  Space,
  SpaceEntity,
  SpaceEntityItemKind,
} from '../../../shared/types';

/** Sample data for tests and previews; these are not saved workspace records. */
export const SPACE_FIXTURES: readonly SpaceEntity[] = [
  {
    id: 'fixture-space-writing',
    ownerId: '11111111-1111-4111-8111-111111111111',
    name: 'Writing',
    icon: 'pen-line',
    description: 'Ideas, drafts, and reference material for writing.',
    tags: ['writing', 'ideas'],
    createdAt: '2026-10-01T09:00:00Z',
    updatedAt: '2026-10-03T14:30:00Z',
  },
  {
    id: 'fixture-space-learning',
    ownerId: '11111111-1111-4111-8111-111111111111',
    name: 'Learning',
    icon: 'book-open',
    description: 'Notes and resources for things I want to understand.',
    tags: ['learning'],
    createdAt: '2026-10-02T10:00:00Z',
    updatedAt: '2026-10-04T11:00:00Z',
  },
  {
    id: 'fixture-space-personal',
    ownerId: '11111111-1111-4111-8111-111111111111',
    name: 'Personal',
    icon: 'house',
    tags: [],
    createdAt: '2026-10-05T08:00:00Z',
    updatedAt: '2026-10-05T08:00:00Z',
  },
];

/** A fresh deterministic record on each call, validated like incoming data. */
export function createSpaceEntityFixture(
  overrides: Partial<SpaceEntity> = {},
): SpaceEntity {
  return spaceSchema.parse({
    id: 'fixture-space-writing',
    ownerId: '11111111-1111-4111-8111-111111111111',
    name: 'Writing',
    icon: 'pen-line',
    description: 'Ideas, drafts, and reference material for writing.',
    tags: ['writing', 'ideas'],
    createdAt: '2026-10-01T09:00:00Z',
    updatedAt: '2026-10-03T14:30:00Z',
    ...overrides,
  });
}

export const spaceItem = {
  kind: 'space' as EntityKind,
  createdAt: SPACE_FIXTURES[0]?.createdAt ?? new Date().toISOString(),
  updatedAt: SPACE_FIXTURES[0]?.updatedAt ?? new Date().toISOString(),
  id: SPACE_FIXTURES[0]?.id ?? 'fixture-space',
  name: SPACE_FIXTURES[0]?.name ?? 'Untitled Space',
  icon: SPACE_FIXTURES[0]?.icon ?? 'folder',
  description: SPACE_FIXTURES[0]?.description ?? 'No description provided.',
  tags: SPACE_FIXTURES[0]?.tags ?? [],
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
