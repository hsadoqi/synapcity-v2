import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  source: {
    listWithRelations: vi.fn(),
    listNavItems: vi.fn(),
    listDocuments: vi.fn(),
    listDashboards: vi.fn(),
  },
  getDocuments: vi.fn(),
  getDashboards: vi.fn(),
}));

vi.mock('@/lib/spaces', () => ({ getSpaceSource: async () => mocks.source }));
vi.mock('@/features/documents/server/get-documents', () => ({
  getDocuments: mocks.getDocuments,
}));
vi.mock('@/features/dashboards/server/get-dashboards', () => ({
  getDashboards: mocks.getDashboards,
}));

import { loadPlaygroundContexts } from './playground-contexts';

const record = (id: string, icon = 'notebook') => ({ id, name: id, icon });

/** A Space with its participation rows, newest addition first. */
const space = (
  id: string,
  documentIds: string[],
  dashboardIds: string[],
  times: { updatedAt?: string; pinnedAt?: string | null } = {},
) => ({
  id,
  name: id,
  icon: 'house',
  updatedAt: times.updatedAt ?? '2026-10-01T00:00:00+00:00',
  pinnedAt: times.pinnedAt ?? null,
  space_documents: documentIds.map((document_id) => ({ document_id })),
  space_dashboards: dashboardIds.map((dashboard_id) => ({ dashboard_id })),
});

function sourceCalls() {
  return {
    listWithRelations: mocks.source.listWithRelations.mock.calls.length,
    listNavItems: mocks.source.listNavItems.mock.calls.length,
    listDocuments: mocks.source.listDocuments.mock.calls.length,
    listDashboards: mocks.source.listDashboards.mock.calls.length,
    getDocuments: mocks.getDocuments.mock.calls.length,
    getDashboards: mocks.getDashboards.mock.calls.length,
  };
}

describe('loadPlaygroundContexts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getDocuments.mockResolvedValue([record('d1'), record('d2')]);
    mocks.getDashboards.mockResolvedValue([record('b1', 'boxes')]);
  });

  it.each([1, 5, 40])(
    'makes the same three reads for %i Spaces',
    async (count) => {
      mocks.source.listWithRelations.mockResolvedValue(
        Array.from({ length: count }, (_, i) => space(`s${i}`, ['d1'], [])),
      );

      const contexts = await loadPlaygroundContexts();

      expect(contexts).toHaveLength(count);
      expect(sourceCalls()).toEqual({
        listWithRelations: 1,
        listNavItems: 0,
        listDocuments: 0,
        listDashboards: 0,
        getDocuments: 1,
        getDashboards: 1,
      });
    },
  );

  it('joins each Space’s rows to its items, keeping the newest addition first and skipping items the caller cannot see', async () => {
    mocks.source.listWithRelations.mockResolvedValue([
      space('s1', ['d2', 'gone', 'd1'], ['b1']),
      space('s2', [], []),
    ]);

    const [first, second] = await loadPlaygroundContexts();

    expect(first).toEqual({
      id: 's1',
      label: 's1',
      icon: 'house',
      groups: [
        {
          id: 'documents',
          label: 'Documents',
          items: [
            { id: 'd2', label: 'd2', icon: 'notebook' },
            { id: 'd1', label: 'd1', icon: 'notebook' },
          ],
          empty: 'No documents in this space',
        },
        {
          id: 'dashboards',
          label: 'Dashboards',
          items: [{ id: 'b1', label: 'b1', icon: 'boxes' }],
          empty: 'No dashboards in this space',
        },
      ],
    });
    expect(second?.groups.map((group) => group.items)).toEqual([[], []]);
  });

  it('lists Spaces in navigation order: pinned first, then most recently changed, ties in the order read', async () => {
    mocks.source.listWithRelations.mockResolvedValue([
      space('newest-created', [], [], {
        updatedAt: '2026-10-01T00:00:00+00:00',
      }),
      space('changed-last', [], [], { updatedAt: '2026-10-09T00:00:00+00:00' }),
      space('older-created', [], [], {
        updatedAt: '2026-10-01T00:00:00+00:00',
      }),
      space('pinned', [], [], {
        updatedAt: '2026-09-01T00:00:00+00:00',
        pinnedAt: '2026-10-05T00:00:00+00:00',
      }),
    ]);

    const contexts = await loadPlaygroundContexts();

    expect(contexts.map((context) => context.id)).toEqual([
      'pinned',
      'changed-last',
      'newest-created',
      'older-created',
    ]);
  });
});
