'use client';

import { SpaceOverview } from '../space-overview';
import { SPACE_FIXTURES } from '../../lib/fixtures/spaces';
import { useCurrentUser } from '@/features/auth/client/user-provider';
import { EntityKind, SpaceItemKind } from '../../shared/types';

export function SpacesContent() {
  const user = useCurrentUser();
  const spaceItem = {
    kind: 'space' as EntityKind,
    createdAt: SPACE_FIXTURES[0]?.createdAt ?? new Date().toISOString(),
    updatedAt: SPACE_FIXTURES[0]?.updatedAt ?? new Date().toISOString(),
    ownerId: user?.id ?? '11111111-1111-4111-8111-111111111111',
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
        kind: 'document' as SpaceItemKind,
      },
      {
        id: 'doc2',
        name: 'Document 2',
        updatedAt: '2026-10-05T08:00:00Z',
        createdAt: '2026-10-05T08:00:00Z',
        icon: 'document',
        kind: 'document' as SpaceItemKind,
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
        kind: 'dashboard' as SpaceItemKind,
      },
      {
        id: 'dash2',
        name: 'Dashboard 2',
        description: 'This is the second dashboard.',
        updatedAt: '2026-10-05T08:00:00Z',
        createdAt: '2026-10-05T08:00:00Z',
        icon: 'boxes',
        kind: 'dashboard' as SpaceItemKind,
      },
    ],
    documentsTotal: 2,
    dashboardsTotal: 2,
  };
  return (
    <div className="flex flex-col flex-1 gap-6">
      <SpaceOverview space={{ ...spaceItem }} />
    </div>
  );
}
