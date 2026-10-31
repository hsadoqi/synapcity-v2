import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  listRecordSummaries: vi.fn(),
  findRecord: vi.fn(),
  fixtureModeEnabled: vi.fn(() => false),
}));

vi.mock('@/lib/supabase/server', () => ({ createClient: mocks.createClient }));
vi.mock('@/lib/access/dev-fixture', () => ({
  fixtureModeEnabled: mocks.fixtureModeEnabled,
}));
vi.mock('@synapcity/server-data', () => ({
  listRecordSummaries: mocks.listRecordSummaries,
  findRecord: mocks.findRecord,
}));

import { DASHBOARD_FIXTURES } from '../../lib/fixtures';
import { getDashboard, getDashboards } from './get-dashboards';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.fixtureModeEnabled.mockReturnValue(false);
  mocks.createClient.mockResolvedValue('client');
});

describe('getDashboards', () => {
  it('reads the owner’s dashboards from the database', async () => {
    mocks.listRecordSummaries.mockResolvedValue([...DASHBOARD_FIXTURES]);

    await expect(getDashboards()).resolves.toEqual([...DASHBOARD_FIXTURES]);
    expect(mocks.listRecordSummaries).toHaveBeenCalledWith(
      'client',
      'dashboards',
    );
  });

  it('propagates failures', async () => {
    const error = new Error('Connection failed');
    mocks.listRecordSummaries.mockRejectedValue(error);

    await expect(getDashboards()).rejects.toBe(error);
  });

  it('reads the sample records in fixture mode without a database', async () => {
    mocks.fixtureModeEnabled.mockReturnValue(true);

    await expect(getDashboards()).resolves.toEqual([...DASHBOARD_FIXTURES]);
    expect(mocks.createClient).not.toHaveBeenCalled();
  });
});

describe('getDashboard', () => {
  const sample = DASHBOARD_FIXTURES[0]!;

  it('reads one of the owner’s dashboards from the database', async () => {
    mocks.findRecord.mockResolvedValue(sample);

    await expect(getDashboard(sample.id)).resolves.toBe(sample);
    expect(mocks.findRecord).toHaveBeenCalledWith(
      'client',
      'dashboards',
      sample.id,
    );
  });

  it('reads the sample record in fixture mode, and null for an unknown id', async () => {
    mocks.fixtureModeEnabled.mockReturnValue(true);

    await expect(getDashboard(sample.id)).resolves.toEqual(sample);
    await expect(getDashboard('missing')).resolves.toBeNull();
    expect(mocks.createClient).not.toHaveBeenCalled();
  });
});
