import { AuthRetryableFetchError } from '@supabase/supabase-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  getClaims: vi.fn(),
  from: vi.fn(),
  update: vi.fn(),
  eq: vi.fn(),
  select: vi.fn(),
  or: vi.fn(),
  fixtureModeEnabled: vi.fn(() => false),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: mocks.getUser, getClaims: mocks.getClaims },
    from: mocks.from,
  }),
}));
vi.mock('@/lib/access/dev-fixture', () => ({
  FIXTURE_MESSAGE: 'Saving is off in fixture mode.',
  fixtureModeEnabled: mocks.fixtureModeEnabled,
}));

import { recordSpaceView, setSpacePinned } from './space-state-actions';

const ID = '9ab8c032-8759-44e9-808d-0573d13f290e';

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  mocks.fixtureModeEnabled.mockReturnValue(false);
  mocks.getUser.mockResolvedValue({
    data: { user: { id: 'user-1' } },
    error: null,
  });
  mocks.getClaims.mockResolvedValue({
    data: { claims: { sub: 'user-1' } },
    error: null,
  });
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

afterEach(() => {
  vi.restoreAllMocks();
});

describe('setSpacePinned', () => {
  it('pins the space and reports the time the database stamped', async () => {
    await expect(setSpacePinned(ID, true)).resolves.toEqual({
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

    await expect(setSpacePinned(ID, false)).resolves.toEqual({
      ok: true,
      pinnedAt: null,
    });
    expect(mocks.update).toHaveBeenCalledWith({ pinned_at: null });
  });

  it.each([
    ['not-a-uuid', true],
    [42, true],
    [ID, 'yes'],
    [ID, undefined],
  ])('rejects bad input (%j, %j) without calling Supabase', async (id, pin) => {
    await expect(setSpacePinned(id, pin)).resolves.toMatchObject({
      ok: false,
    });
    expect(mocks.getUser).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it('reports signed-out callers', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });

    await expect(setSpacePinned(ID, true)).resolves.toMatchObject({
      ok: false,
      signedOut: true,
    });
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it('does not report success when no row was written, and logs the code', async () => {
    mocks.select.mockResolvedValue({ data: [], error: null });

    await expect(setSpacePinned(ID, true)).resolves.toEqual({
      ok: false,
      error: 'Could not save your changes. Try again.',
    });
    expect(console.warn).toHaveBeenCalledWith('setSpacePinned failed', {
      code: 'row_not_written',
      status: undefined,
    });
  });

  it('reports a database error', async () => {
    mocks.select.mockResolvedValue({ data: null, error: { code: '42501' } });

    await expect(setSpacePinned(ID, true)).resolves.toMatchObject({
      ok: false,
    });
  });

  it('does nothing in fixture mode', async () => {
    mocks.fixtureModeEnabled.mockReturnValue(true);

    await expect(setSpacePinned(ID, true)).resolves.toEqual({
      ok: false,
      error: 'Saving is off in fixture mode.',
    });
    expect(mocks.update).not.toHaveBeenCalled();
  });
});

describe('recordSpaceView', () => {
  it('stamps the view unless one was recorded in the last minute', async () => {
    await recordSpaceView(ID);

    expect(mocks.update.mock.calls[0]![0].last_viewed_at).toEqual(
      expect.any(String),
    );
    expect(mocks.eq).toHaveBeenCalledWith('id', ID);
    expect(mocks.or).toHaveBeenCalledWith(
      expect.stringMatching(/^last_viewed_at\.is\.null,last_viewed_at\.lt\./),
    );
  });

  it('checks the caller from the session claims, without a provider lookup', async () => {
    await recordSpaceView(ID);

    expect(mocks.getClaims).toHaveBeenCalled();
    expect(mocks.getUser).not.toHaveBeenCalled();
  });

  it('ignores a malformed id and a signed-out caller, logging nothing', async () => {
    await recordSpaceView('nope');
    expect(mocks.update).not.toHaveBeenCalled();

    mocks.getClaims.mockResolvedValue({ data: null, error: null });
    await recordSpaceView(ID);
    expect(mocks.update).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('never throws when the database refuses', async () => {
    mocks.or.mockResolvedValue({ error: { code: '42501' } });

    await expect(recordSpaceView(ID)).resolves.toBeUndefined();
  });

  it('does nothing in fixture mode', async () => {
    mocks.fixtureModeEnabled.mockReturnValue(true);

    await recordSpaceView(ID);

    expect(mocks.update).not.toHaveBeenCalled();
  });
});

describe('setSpacePinned caller identity', () => {
  it('tells the caller to try again when the provider is unreachable', async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: new AuthRetryableFetchError('fetch failed', 0),
    });

    await expect(setSpacePinned(ID, true)).resolves.toEqual({
      ok: false,
      error: 'Could not save your changes. Try again.',
    });
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it('asks a signed-out caller to sign in again and logs it by code only', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });

    await expect(setSpacePinned(ID, true)).resolves.toEqual({
      ok: false,
      error: 'Sign in again to update your profile.',
      signedOut: true,
    });
    expect(console.warn).toHaveBeenCalledWith('getCallerIdentity failed', {
      code: undefined,
      status: undefined,
    });
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it.each([
    ['unreachable', new AuthRetryableFetchError('fetch failed', 0)],
    ['signed out', null],
  ])('records no view when the session check says %s', async (_case, error) => {
    mocks.getClaims.mockResolvedValue({ data: null, error });

    await expect(recordSpaceView(ID)).resolves.toBeUndefined();
    expect(mocks.update).not.toHaveBeenCalled();
  });
});
