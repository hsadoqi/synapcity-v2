import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  listSummaries: vi.fn(),
  getDocuments: vi.fn(),
  getDashboards: vi.fn(),
}));

vi.mock('@/lib/spaces', () => ({
  getSpaceSource: async () => ({ listSummaries: mocks.listSummaries }),
}));
vi.mock('@/features/documents/server/get-documents', () => ({
  getDocuments: mocks.getDocuments,
}));
vi.mock('@/features/dashboards/server/get-dashboards', () => ({
  getDashboards: mocks.getDashboards,
}));

import { getSidebarRecords } from './get-sidebar-records';

const row = (id: string) => ({
  id,
  name: id,
  updatedAt: '2026-10-01T00:00:00Z',
  pinnedAt: null,
});

describe('getSidebarRecords', () => {
  beforeEach(() => vi.clearAllMocks());

  it('loads the latest of each kind', async () => {
    mocks.listSummaries.mockResolvedValue([row('s1')]);
    mocks.getDocuments.mockResolvedValue([row('d1')]);
    mocks.getDashboards.mockResolvedValue([row('b1')]);

    expect(await getSidebarRecords()).toEqual({
      spaces: [{ id: 's1', name: 's1' }],
      documents: [{ id: 'd1', name: 'd1' }],
      dashboards: [{ id: 'b1', name: 'b1' }],
    });
  });

  it('leaves one list empty when that kind fails to load', async () => {
    mocks.listSummaries.mockResolvedValue([row('s1')]);
    mocks.getDocuments.mockRejectedValue(new Error('offline'));
    mocks.getDashboards.mockResolvedValue([]);

    const records = await getSidebarRecords();
    expect(records.spaces).toHaveLength(1);
    expect(records.documents).toEqual([]);
  });
});
