import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  findRecord: vi.fn(),
  createClient: vi.fn(),
  fixtureModeEnabled: vi.fn(() => false),
  /** React's `cache`, as one request sees it: memoized until the request ends. */
  request: { memo: new Map<string, unknown>() },
}));

vi.mock('react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react')>()),
  cache:
    <A extends unknown[], R>(fn: (...args: A) => R) =>
    (...args: A): R => {
      const key = JSON.stringify(args);
      if (!mocks.request.memo.has(key))
        mocks.request.memo.set(key, fn(...args));
      return mocks.request.memo.get(key) as R;
    },
}));
vi.mock('@synapcity/server-data', () => ({
  findRecord: mocks.findRecord,
  listRecordSummaries: vi.fn(),
  setRecordPinned: vi.fn(),
}));
vi.mock('@/lib/supabase/server', () => ({ createClient: mocks.createClient }));
vi.mock('@/lib/access/dev-fixture', () => ({
  FIXTURE_MESSAGE: 'fixture',
  fixtureModeEnabled: mocks.fixtureModeEnabled,
}));
vi.mock('@/lib/access/caller', () => ({
  getCallerIdentity: vi.fn(),
  SAVE_FAILED: 'save failed',
}));

import { loadRecord } from './records';

const row = { id: 'x1', name: 'Launch' };

describe('loadRecord', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.request.memo = new Map();
    mocks.fixtureModeEnabled.mockReturnValue(false);
    mocks.createClient.mockResolvedValue({ client: true });
    mocks.findRecord.mockResolvedValue(row);
  });

  it('reads a record once per request however many times the page and its metadata ask', async () => {
    await loadRecord('dashboards', 'x1', []);
    await loadRecord('dashboards', 'x1', []);

    expect(mocks.findRecord).toHaveBeenCalledOnce();
  });

  it('remembers a missing record too', async () => {
    mocks.findRecord.mockResolvedValue(null);

    await expect(loadRecord('documents', 'gone', [])).resolves.toBeNull();
    await expect(loadRecord('documents', 'gone', [])).resolves.toBeNull();
    expect(mocks.findRecord).toHaveBeenCalledOnce();
  });

  it('reads separately for a different kind or id', async () => {
    await loadRecord('dashboards', 'x1', []);
    await loadRecord('documents', 'x1', []);
    await loadRecord('dashboards', 'x2', []);

    expect(mocks.findRecord).toHaveBeenCalledTimes(3);
  });

  it('shares nothing between requests: a new request reads again', async () => {
    await loadRecord('dashboards', 'x1', []);
    mocks.request.memo = new Map(); // the next request
    mocks.findRecord.mockResolvedValue({ ...row, name: 'Renamed' });

    await expect(loadRecord('dashboards', 'x1', [])).resolves.toMatchObject({
      name: 'Renamed',
    });
    expect(mocks.findRecord).toHaveBeenCalledTimes(2);
  });

  it('reads the samples in fixture mode without building a client', async () => {
    mocks.fixtureModeEnabled.mockReturnValue(true);

    await expect(loadRecord('dashboards', 'x1', [row as never])).resolves.toBe(
      row,
    );
    expect(mocks.createClient).not.toHaveBeenCalled();
    expect(mocks.findRecord).not.toHaveBeenCalled();
  });
});
