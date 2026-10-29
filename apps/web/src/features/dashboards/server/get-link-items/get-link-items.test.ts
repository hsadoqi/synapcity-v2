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
vi.mock('../get-dashboards', () => ({ getDashboards: mocks.getDashboards }));

import { getDashboardLinkItems } from './get-link-items';

const record = (id: string) => ({
  id,
  name: id,
  icon: 'folder',
  pinnedAt: null,
  lastViewedAt: null,
});

describe('getDashboardLinkItems', () => {
  beforeEach(() => vi.clearAllMocks());

  it('lists all three kinds with their pages', async () => {
    mocks.listSummaries.mockResolvedValue([record('s1')]);
    mocks.getDocuments.mockResolvedValue([record('d1')]);
    mocks.getDashboards.mockResolvedValue([record('b1')]);

    const items = await getDashboardLinkItems('u1');

    expect(items.map((i) => [i.kind, i.id, i.href])).toEqual([
      ['space', 's1', '/u1/home/spaces/s1'],
      ['document', 'd1', '/u1/home/documents/d1'],
      ['dashboard', 'b1', '/u1/home/dashboards/b1'],
    ]);
  });

  it('leaves out a kind that fails to load instead of failing the page', async () => {
    mocks.listSummaries.mockResolvedValue([record('s1')]);
    mocks.getDocuments.mockRejectedValue(new Error('offline'));
    mocks.getDashboards.mockResolvedValue([]);

    const items = await getDashboardLinkItems('u1');

    expect(items.map((i) => i.kind)).toEqual(['space']);
  });
});
