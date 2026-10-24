import type { SupabaseServerClient } from '@synapcity/server-supabase';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { recordSpaceView, setSpacePinned } from './space-writes';

const ID = '9ab8c032-8759-44e9-808d-0573d13f290e';

const mocks = {
  from: vi.fn(),
  update: vi.fn(),
  eq: vi.fn(),
  select: vi.fn(),
  or: vi.fn(),
};
const client = { from: mocks.from } as unknown as SupabaseServerClient;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.select.mockResolvedValue({
    data: [{ pinned_at: '2026-10-18T12:00:00+00:00' }],
    error: null,
  });
  // `eq` ends a pin update with `.select`, and a view update with `.or`.
  mocks.or.mockResolvedValue({ error: null });
  mocks.eq.mockReturnValue({ select: mocks.select, or: mocks.or });
  mocks.update.mockReturnValue({ eq: mocks.eq });
  mocks.from.mockReturnValue({ update: mocks.update });
});

describe('setSpacePinned', () => {
  it('pins the space and reports the time the database stamped', async () => {
    await expect(setSpacePinned(client, ID, true)).resolves.toEqual({
      ok: true,
      pinnedAt: '2026-10-18T12:00:00+00:00',
    });
    expect(mocks.from).toHaveBeenCalledWith('spaces');
    expect(mocks.update.mock.calls[0]![0].pinned_at).toEqual(
      expect.any(String),
    );
    expect(mocks.eq).toHaveBeenCalledWith('id', ID);
  });

  it('unpins by clearing the time', async () => {
    mocks.select.mockResolvedValue({
      data: [{ pinned_at: null }],
      error: null,
    });

    await expect(setSpacePinned(client, ID, false)).resolves.toEqual({
      ok: true,
      pinnedAt: null,
    });
    expect(mocks.update).toHaveBeenCalledWith({ pinned_at: null });
  });

  it('does not report success when row-level security wrote no row', async () => {
    mocks.select.mockResolvedValue({ data: [], error: null });

    await expect(setSpacePinned(client, ID, true)).resolves.toEqual({
      ok: false,
      error: { code: 'row_not_written' },
    });
  });

  it('returns the database error', async () => {
    const error = { code: '42501' };
    mocks.select.mockResolvedValue({ data: null, error });

    await expect(setSpacePinned(client, ID, true)).resolves.toEqual({
      ok: false,
      error,
    });
  });
});

describe('recordSpaceView', () => {
  const now = new Date('2026-10-18T12:00:00.000Z');

  it('stamps the view unless one was recorded in the last minute', async () => {
    await expect(recordSpaceView(client, ID, now)).resolves.toEqual({
      ok: true,
    });

    expect(mocks.from).toHaveBeenCalledWith('spaces');
    expect(mocks.update).toHaveBeenCalledWith({
      last_viewed_at: '2026-10-18T12:00:00.000Z',
    });
    expect(mocks.eq).toHaveBeenCalledWith('id', ID);
    expect(mocks.or).toHaveBeenCalledWith(
      'last_viewed_at.is.null,last_viewed_at.lt.2026-10-18T11:59:00.000Z',
    );
  });

  it('returns the database error instead of throwing', async () => {
    const error = { code: '42501' };
    mocks.or.mockResolvedValue({ error });

    await expect(recordSpaceView(client, ID, now)).resolves.toEqual({
      ok: false,
      error,
    });
  });
});
