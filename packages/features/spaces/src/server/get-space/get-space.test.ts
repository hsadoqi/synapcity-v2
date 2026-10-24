import type { BaseRecord } from '@synapcity/domain-records';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { SpaceSource } from '../types';
import { getSpace } from './get-space';

/** Only the three methods the loader reads; the rest would fail loudly if called. */
const stub = {
  find: vi.fn(),
  listDocuments: vi.fn(),
  listDashboards: vi.fn(),
};
const source = stub as unknown as SpaceSource;

const space = {
  id: 's1',
  ownerId: '11111111-1111-4111-8111-111111111111',
  name: 'Writing',
  icon: 'pen-line',
  description: 'Drafts',
  tags: ['writing'],
  createdAt: '2026-10-01T09:00:00Z',
  updatedAt: '2026-10-03T14:30:00Z',
};

const record = (id: string, name: string, icon: string): BaseRecord => ({
  id,
  ownerId: space.ownerId,
  name,
  description: `${name} notes`,
  icon,
  tags: [],
  createdAt: '2026-10-04T08:00:00Z',
  updatedAt: '2026-10-05T08:00:00Z',
  pinnedAt: null,
  lastViewedAt: null,
});

describe('getSpace', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stub.listDocuments.mockResolvedValue([]);
    stub.listDashboards.mockResolvedValue([]);
  });

  it('returns the saved space marked as a space', async () => {
    stub.find.mockResolvedValue(space);

    await expect(getSpace(source, 's1')).resolves.toMatchObject({
      ...space,
      kind: 'space',
    });
    expect(stub.find).toHaveBeenCalledExactlyOnceWith('s1');
  });

  it('shows an empty Space with zero totals, never sample items', async () => {
    stub.find.mockResolvedValue(space);

    const result = (await getSpace(source, 's1'))!;

    expect(result.documents).toEqual([]);
    expect(result.dashboards).toEqual([]);
    expect(result.documentsTotal).toBe(0);
    expect(result.dashboardsTotal).toBe(0);
  });

  it('maps participating records onto detail items with matching totals', async () => {
    stub.find.mockResolvedValue(space);
    stub.listDocuments.mockResolvedValue([
      record('d1', 'Outline', 'file-text'),
      record('d2', 'Notes', 'notebook'),
    ]);
    stub.listDashboards.mockResolvedValue([
      record('b1', 'Progress', 'layout-dashboard'),
    ]);

    const result = (await getSpace(source, 's1'))!;

    expect(stub.listDocuments).toHaveBeenCalledWith('s1');
    expect(stub.listDashboards).toHaveBeenCalledWith('s1');
    expect(result.documents).toEqual([
      {
        id: 'd1',
        name: 'Outline',
        description: 'Outline notes',
        icon: 'file-text',
        createdAt: '2026-10-04T08:00:00Z',
        updatedAt: '2026-10-05T08:00:00Z',
        kind: 'document',
      },
      expect.objectContaining({ id: 'd2', kind: 'document' }),
    ]);
    expect(result.dashboards).toEqual([
      expect.objectContaining({ id: 'b1', kind: 'dashboard' }),
    ]);
    expect(result.documentsTotal).toBe(2);
    expect(result.dashboardsTotal).toBe(1);
  });

  it('returns null for a missing space and reads no items', async () => {
    stub.find.mockResolvedValue(null);

    expect(await getSpace(source, 'missing')).toBeNull();
    expect(stub.listDocuments).not.toHaveBeenCalled();
    expect(stub.listDashboards).not.toHaveBeenCalled();
  });

  it('propagates source failures', async () => {
    const error = new Error('Connection failed');
    stub.find.mockRejectedValue(error);

    await expect(getSpace(source, 's1')).rejects.toBe(error);
  });
});
