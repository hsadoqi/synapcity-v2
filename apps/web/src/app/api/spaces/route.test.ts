import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getVerifiedIdentity } = vi.hoisted(() => ({
  getVerifiedIdentity: vi.fn(),
}));
const { list } = vi.hoisted(() => ({ list: vi.fn() }));
const { getSpaceSource } = vi.hoisted(() => ({
  getSpaceSource: vi.fn(),
}));
const { fixtureModeEnabled } = vi.hoisted(() => ({
  fixtureModeEnabled: vi.fn(() => false),
}));

vi.mock('@/features/auth/server/session', () => ({ getVerifiedIdentity }));
vi.mock('@/lib/spaces', () => ({ getSpaceSource }));
vi.mock('@/lib/access/dev-fixture', () => ({ fixtureModeEnabled }));

import { GET } from './route';

describe('GET /api/spaces', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fixtureModeEnabled.mockReturnValue(false);
    getSpaceSource.mockResolvedValue({ list });
  });

  it('rejects a signed-out request without reading any spaces', async () => {
    getVerifiedIdentity.mockResolvedValue({ status: 'signed-out' });

    const response = await GET();

    expect(response.status).toBe(401);
    expect(list).not.toHaveBeenCalled();
  });

  it('returns the owner’s spaces uncached', async () => {
    getVerifiedIdentity.mockResolvedValue({
      status: 'verified',
      identity: { userId: 'u1' },
    });
    list.mockResolvedValue([{ id: 's1' }]);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    await expect(response.json()).resolves.toEqual([{ id: 's1' }]);
  });

  it('serves the samples in fixture mode without a session', async () => {
    fixtureModeEnabled.mockReturnValue(true);
    list.mockResolvedValue([]);

    expect((await GET()).status).toBe(200);
    expect(getVerifiedIdentity).not.toHaveBeenCalled();
  });
});
