import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  listDashboardSummaries: vi.fn(),
  fixtureModeEnabled: vi.fn(() => false),
}));

vi.mock('@/lib/supabase/server', () => ({ createClient: mocks.createClient }));
vi.mock('@/lib/access/dev-fixture', () => ({
  fixtureModeEnabled: mocks.fixtureModeEnabled,
}));
vi.mock('@synapcity/server-data', () => ({
  listDashboardSummaries: mocks.listDashboardSummaries,
}));

import { DEMO_DASHBOARDS } from '@/lib/demo/dashboards';
import { getDashboards } from './get-dashboards';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.fixtureModeEnabled.mockReturnValue(false);
  mocks.createClient.mockResolvedValue('client');
});

describe('getDashboards', () => {
  it('reads the owner’s dashboards from the database', async () => {
    mocks.listDashboardSummaries.mockResolvedValue([...DEMO_DASHBOARDS]);

    await expect(getDashboards()).resolves.toEqual([...DEMO_DASHBOARDS]);
    expect(mocks.listDashboardSummaries).toHaveBeenCalledWith('client');
  });

  it('propagates failures', async () => {
    const error = new Error('Connection failed');
    mocks.listDashboardSummaries.mockRejectedValue(error);

    await expect(getDashboards()).rejects.toBe(error);
  });

  it('reads the sample records in fixture mode without a database', async () => {
    mocks.fixtureModeEnabled.mockReturnValue(true);

    await expect(getDashboards()).resolves.toEqual([...DEMO_DASHBOARDS]);
    expect(mocks.createClient).not.toHaveBeenCalled();
  });
});
