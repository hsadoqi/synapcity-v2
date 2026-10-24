import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getVerifiedIdentity } = vi.hoisted(() => ({
  getVerifiedIdentity: vi.fn(),
}));
const { findSpace } = vi.hoisted(() => ({ findSpace: vi.fn() }));
const { fixtureModeEnabled } = vi.hoisted(() => ({
  fixtureModeEnabled: vi.fn(() => false),
}));

vi.mock('@/features/auth/server/session', () => ({ getVerifiedIdentity }));
vi.mock('@/features/spaces/server/space-repository', () => ({ findSpace }));
vi.mock('@/lib/access/dev-fixture', () => ({ fixtureModeEnabled }));

import { GET } from './route';

const call = (spaceId: string) =>
  GET(new Request('http://localhost/api/spaces/x'), {
    params: Promise.resolve({ spaceId }),
  });

describe('GET /api/spaces/[spaceId]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fixtureModeEnabled.mockReturnValue(false);
  });

  it('rejects a signed-out request without looking anything up', async () => {
    getVerifiedIdentity.mockResolvedValue({ status: 'signed-out' });

    expect((await call('s1')).status).toBe(401);
    expect(findSpace).not.toHaveBeenCalled();
  });

  it('returns the space uncached', async () => {
    getVerifiedIdentity.mockResolvedValue({
      status: 'verified',
      identity: { userId: 'u1' },
    });
    findSpace.mockResolvedValue({ id: 's1' });

    const response = await call('s1');

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(findSpace).toHaveBeenCalledWith('s1');
    await expect(response.json()).resolves.toEqual({ id: 's1' });
  });

  it('answers 404 when the space is missing or not the owner’s', async () => {
    getVerifiedIdentity.mockResolvedValue({
      status: 'verified',
      identity: { userId: 'u1' },
    });
    findSpace.mockResolvedValue(null);

    expect((await call('s2')).status).toBe(404);
  });
});
