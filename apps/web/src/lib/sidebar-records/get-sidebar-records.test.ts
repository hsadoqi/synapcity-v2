import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  listLatest: vi.fn(),
  getLatestDocuments: vi.fn(),
  getLatestDashboards: vi.fn(),
  logFailure: vi.fn(),
}));

vi.mock('@/lib/spaces', () => ({
  getSpaceSource: async () => ({ listLatest: mocks.listLatest }),
}));
vi.mock('@/features/documents/server/get-documents', () => ({
  getLatestDocuments: mocks.getLatestDocuments,
}));
vi.mock('@/features/dashboards/server/get-dashboards', () => ({
  getLatestDashboards: mocks.getLatestDashboards,
}));
vi.mock('@/lib/log-failure', () => ({ logFailure: mocks.logFailure }));

import { getSidebarRecords } from './get-sidebar-records';
import { SIDEBAR_RECORD_LIMIT } from './latest-records';

const row = (id: string, updatedAt = '2026-10-01T00:00:00Z') => ({
  id,
  name: id,
  updatedAt,
  pinnedAt: null,
});

describe('getSidebarRecords', () => {
  beforeEach(() => vi.clearAllMocks());

  it('reads a bounded list of each kind and keeps only what the sidebar shows', async () => {
    mocks.listLatest.mockResolvedValue([row('s1')]);
    mocks.getLatestDocuments.mockResolvedValue([row('d1')]);
    mocks.getLatestDashboards.mockResolvedValue([row('b1')]);

    expect(await getSidebarRecords()).toEqual({
      spaces: [{ id: 's1', name: 's1' }],
      documents: [{ id: 'd1', name: 'd1' }],
      dashboards: [{ id: 'b1', name: 'b1' }],
    });
    expect(mocks.listLatest).toHaveBeenCalledWith(SIDEBAR_RECORD_LIMIT);
    expect(mocks.getLatestDocuments).toHaveBeenCalledWith(SIDEBAR_RECORD_LIMIT);
    expect(mocks.getLatestDashboards).toHaveBeenCalledWith(
      SIDEBAR_RECORD_LIMIT,
    );
    expect(mocks.logFailure).not.toHaveBeenCalled();
  });

  it('keeps the order the bounded read returns', async () => {
    const ordered = [
      {
        ...row('pinned', '2026-09-01T00:00:00Z'),
        pinnedAt: '2026-10-02T00:00:00Z',
      },
      row('newer', '2026-10-05T00:00:00Z'),
      row('tie-a', '2026-10-01T00:00:00Z'),
      row('tie-b', '2026-10-01T00:00:00Z'),
    ];
    mocks.listLatest.mockResolvedValue([]);
    mocks.getLatestDocuments.mockResolvedValue(ordered);
    mocks.getLatestDashboards.mockResolvedValue([]);

    const { documents } = await getSidebarRecords();

    expect(documents.map((record) => record.id)).toEqual(
      ordered.map((record) => record.id),
    );
  });

  it('leaves one list empty and logs the code when that kind fails to load', async () => {
    mocks.listLatest.mockResolvedValue([row('s1')]);
    mocks.getLatestDocuments.mockRejectedValue(
      Object.assign(new Error('row data in here'), { code: '57014' }),
    );
    mocks.getLatestDashboards.mockResolvedValue([]);

    const records = await getSidebarRecords();
    expect(records.spaces).toHaveLength(1);
    expect(records.documents).toEqual([]);
    expect(mocks.logFailure).toHaveBeenCalledTimes(1);
    expect(mocks.logFailure).toHaveBeenCalledWith(
      'getSidebarRecords',
      expect.objectContaining({ code: '57014' }),
      { kind: 'documents' },
    );
  });
});
