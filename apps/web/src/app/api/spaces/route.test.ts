import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getVerifiedIdentity } = vi.hoisted(() => ({
  getVerifiedIdentity: vi.fn(),
}));
const { list, writes } = vi.hoisted(() => ({
  list: vi.fn(),
  writes: {
    create: vi.fn(),
    setPinned: vi.fn(),
    recordView: vi.fn(),
    addDocument: vi.fn(),
    addDashboard: vi.fn(),
  },
}));
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
    getSpaceSource.mockResolvedValue({ list, ...writes });
  });

  it('rejects a signed-out request without reading any spaces', async () => {
    getVerifiedIdentity.mockResolvedValue({ status: 'signed-out' });

    const response = await GET();

    expect(response.status).toBe(401);
    expect(list).not.toHaveBeenCalled();
  });

  it('answers 503, not 401, when the Auth service is unavailable', async () => {
    getVerifiedIdentity.mockResolvedValue({ status: 'unavailable' });

    const response = await GET();

    expect(response.status).toBe(503);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
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

  it('only reads: no space is created, pinned, viewed or added to', async () => {
    getVerifiedIdentity.mockResolvedValue({
      status: 'verified',
      identity: { userId: 'u1' },
    });
    list.mockResolvedValue([]);
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});

    await GET();
    await GET();

    expect(list).toHaveBeenCalledTimes(2);
    for (const write of Object.values(writes)) {
      expect(write).not.toHaveBeenCalled();
    }
    expect(log).not.toHaveBeenCalled();
    log.mockRestore();
  });

  it('serves the samples in fixture mode without a session', async () => {
    fixtureModeEnabled.mockReturnValue(true);
    list.mockResolvedValue([]);

    expect((await GET()).status).toBe(200);
    expect(getVerifiedIdentity).not.toHaveBeenCalled();
  });
});
