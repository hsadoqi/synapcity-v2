import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  fixtureModeEnabled: vi.fn(() => false),
  createClient: vi.fn(),
  serverSpaceSource: vi.fn(),
}));
vi.mock('@/lib/access/dev-fixture', () => ({
  fixtureModeEnabled: mocks.fixtureModeEnabled,
}));
vi.mock('@/lib/supabase/server', () => ({ createClient: mocks.createClient }));
vi.mock('@synapcity/features-spaces/server', () => ({
  serverSpaceSource: mocks.serverSpaceSource,
}));

import { DEMO_SPACES } from '../demo/space-source';
import { getSpaceSource } from './get-space-source';

describe('getSpaceSource', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.fixtureModeEnabled.mockReturnValue(false);
  });

  it('uses the sample records and builds no request client in fixture mode', async () => {
    mocks.fixtureModeEnabled.mockReturnValue(true);

    const source = await getSpaceSource();

    await expect(source.list()).resolves.toEqual([...DEMO_SPACES]);
    expect(mocks.createClient).not.toHaveBeenCalled();
    expect(mocks.serverSpaceSource).not.toHaveBeenCalled();
  });

  it('reads through the request client otherwise, never the sample records', async () => {
    const client = { request: true };
    const real = { list: vi.fn().mockResolvedValue([]) };
    mocks.createClient.mockResolvedValue(client);
    mocks.serverSpaceSource.mockReturnValue(real);

    const source = await getSpaceSource();

    await expect(source.list()).resolves.toEqual([]);
    expect(mocks.createClient).toHaveBeenCalledTimes(1);
    expect(mocks.serverSpaceSource).toHaveBeenCalledWith(client);
    expect(source).toBe(real);
  });
});
