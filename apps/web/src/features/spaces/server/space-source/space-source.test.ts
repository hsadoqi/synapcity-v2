import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  fixtureModeEnabled: vi.fn(() => false),
  createClient: vi.fn(),
  listSpaces: vi.fn(),
}));
vi.mock('@/lib/access/dev-fixture', () => ({
  fixtureModeEnabled: mocks.fixtureModeEnabled,
}));
vi.mock('@/lib/supabase/server', () => ({ createClient: mocks.createClient }));
vi.mock('@synapcity/server-data', () => ({
  listSpaces: mocks.listSpaces,
  listSpaceSummaries: vi.fn(),
  findSpace: vi.fn(),
  setSpacePinned: vi.fn(),
  recordSpaceView: vi.fn(),
  listSpaceDocuments: vi.fn(),
  listSpaceDashboards: vi.fn(),
}));

import { SPACE_FIXTURES } from '../../lib/fixtures';
import { getSpaceSource } from './index';

describe('getSpaceSource', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.fixtureModeEnabled.mockReturnValue(false);
  });

  it('uses the sample records and builds no request client in fixture mode', async () => {
    mocks.fixtureModeEnabled.mockReturnValue(true);

    const source = await getSpaceSource();

    await expect(source.list()).resolves.toEqual([...SPACE_FIXTURES]);
    expect(mocks.createClient).not.toHaveBeenCalled();
    expect(mocks.listSpaces).not.toHaveBeenCalled();
  });

  it('reads through the request client otherwise, never the sample records', async () => {
    const client = { request: true };
    mocks.createClient.mockResolvedValue(client);
    mocks.listSpaces.mockResolvedValue([]);

    const source = await getSpaceSource();

    await expect(source.list()).resolves.toEqual([]);
    expect(mocks.createClient).toHaveBeenCalledTimes(1);
    expect(mocks.listSpaces).toHaveBeenCalledWith(client);
  });
});
