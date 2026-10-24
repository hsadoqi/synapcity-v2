import type { BaseRecord } from '@synapcity/domain-records';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { notFound } = vi.hoisted(() => ({ notFound: vi.fn() }));
const source = vi.hoisted(() => ({
  find: vi.fn(),
  listDocuments: vi.fn(),
  listDashboards: vi.fn(),
}));

vi.mock('next/navigation', () => ({ notFound }));
vi.mock('../space-source', () => ({
  getSpaceSource: async () => source,
}));

import { getSpace } from './get-space';

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
    notFound.mockImplementation(() => {
      throw new Error('NEXT_HTTP_ERROR_FALLBACK;404');
    });
    source.listDocuments.mockResolvedValue([]);
    source.listDashboards.mockResolvedValue([]);
  });

  it('returns the saved space marked as a space', async () => {
    source.find.mockResolvedValue(space);

    await expect(getSpace('s1')).resolves.toMatchObject({
      ...space,
      kind: 'space',
    });
    expect(source.find).toHaveBeenCalledExactlyOnceWith('s1');
    expect(notFound).not.toHaveBeenCalled();
  });

  it('shows an empty Space with zero totals, never sample items', async () => {
    source.find.mockResolvedValue(space);

    const result = await getSpace('s1');

    expect(result.documents).toEqual([]);
    expect(result.dashboards).toEqual([]);
    expect(result.documentsTotal).toBe(0);
    expect(result.dashboardsTotal).toBe(0);
  });

  it('maps participating records onto detail items with matching totals', async () => {
    source.find.mockResolvedValue(space);
    source.listDocuments.mockResolvedValue([
      record('d1', 'Outline', 'file-text'),
      record('d2', 'Notes', 'notebook'),
    ]);
    source.listDashboards.mockResolvedValue([
      record('b1', 'Progress', 'layout-dashboard'),
    ]);

    const result = await getSpace('s1');

    expect(source.listDocuments).toHaveBeenCalledWith('s1');
    expect(source.listDashboards).toHaveBeenCalledWith('s1');
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

  it('uses the Next.js not-found boundary for a missing space and reads no items', async () => {
    source.find.mockResolvedValue(null);

    await expect(getSpace('missing')).rejects.toThrow(
      'NEXT_HTTP_ERROR_FALLBACK;404',
    );
    expect(notFound).toHaveBeenCalledOnce();
    expect(source.listDocuments).not.toHaveBeenCalled();
  });

  it('propagates source failures', async () => {
    const error = new Error('Connection failed');
    source.find.mockRejectedValue(error);

    await expect(getSpace('s1')).rejects.toBe(error);
  });
});
