import { beforeEach, describe, expect, it, vi } from 'vitest';

const { notFound } = vi.hoisted(() => ({ notFound: vi.fn() }));
const { findSpace } = vi.hoisted(() => ({ findSpace: vi.fn() }));

vi.mock('next/navigation', () => ({ notFound }));
vi.mock('../space-repository', () => ({ findSpace }));

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

describe('getSpace', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    notFound.mockImplementation(() => {
      throw new Error('NEXT_HTTP_ERROR_FALLBACK;404');
    });
  });

  it('returns the saved space marked as a space', async () => {
    findSpace.mockResolvedValue(space);

    await expect(getSpace('s1')).resolves.toMatchObject({
      ...space,
      kind: 'space',
    });
    expect(findSpace).toHaveBeenCalledExactlyOnceWith('s1');
    expect(notFound).not.toHaveBeenCalled();
  });

  it('attaches placeholder documents and dashboards with matching totals', async () => {
    findSpace.mockResolvedValue(space);

    const result = await getSpace('s1');

    expect(result.documentsTotal).toBe(result.documents.length);
    expect(result.dashboardsTotal).toBe(result.dashboards.length);
    expect(result.documents.every((item) => item.kind === 'document')).toBe(
      true,
    );
    expect(result.dashboards.every((item) => item.kind === 'dashboard')).toBe(
      true,
    );
  });

  it('uses the Next.js not-found boundary for a missing space', async () => {
    findSpace.mockResolvedValue(null);

    await expect(getSpace('missing')).rejects.toThrow(
      'NEXT_HTTP_ERROR_FALLBACK;404',
    );
    expect(notFound).toHaveBeenCalledOnce();
  });

  it('propagates repository failures', async () => {
    const error = new Error('Connection failed');
    findSpace.mockRejectedValue(error);

    await expect(getSpace('s1')).rejects.toBe(error);
  });
});
