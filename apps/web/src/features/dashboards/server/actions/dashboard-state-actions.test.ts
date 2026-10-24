import { AuthRetryableFetchError } from '@supabase/supabase-js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  setOwnedRecordPinned: vi.fn(),
  fixtureModeEnabled: vi.fn(() => false),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ auth: { getUser: mocks.getUser } }),
}));
vi.mock('@/lib/access/dev-fixture', () => ({
  FIXTURE_MESSAGE: 'Saving is off in fixture mode.',
  fixtureModeEnabled: mocks.fixtureModeEnabled,
}));
vi.mock('@/lib/owned-records', () => ({
  setOwnedRecordPinned: mocks.setOwnedRecordPinned,
}));

import { setDashboardPinned } from './dashboard-state-actions';

const ID = '9ab8c032-8759-44e9-808d-0573d13f290e';

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  mocks.fixtureModeEnabled.mockReturnValue(false);
  mocks.getUser.mockResolvedValue({
    data: { user: { id: 'user-1' } },
    error: null,
  });
  mocks.setOwnedRecordPinned.mockResolvedValue({
    ok: true,
    pinnedAt: '2026-10-18T12:00:00+00:00',
  });
});

describe('setDashboardPinned', () => {
  it('pins the dashboard and reports the time the database stamped', async () => {
    await expect(setDashboardPinned(ID, true)).resolves.toEqual({
      ok: true,
      pinnedAt: '2026-10-18T12:00:00+00:00',
    });
    expect(mocks.setOwnedRecordPinned).toHaveBeenCalledWith(
      expect.anything(),
      'dashboards',
      ID,
      true,
    );
  });

  it.each([
    ['not-a-uuid', true],
    [42, true],
    [ID, 'yes'],
    [ID, undefined],
  ])('rejects bad input (%j, %j) without calling Supabase', async (id, pin) => {
    await expect(setDashboardPinned(id, pin)).resolves.toMatchObject({
      ok: false,
    });
    expect(mocks.getUser).not.toHaveBeenCalled();
    expect(mocks.setOwnedRecordPinned).not.toHaveBeenCalled();
  });

  it('reports signed-out callers', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });

    await expect(setDashboardPinned(ID, true)).resolves.toMatchObject({
      ok: false,
      signedOut: true,
    });
    expect(mocks.setOwnedRecordPinned).not.toHaveBeenCalled();
  });

  it('reports a failed save in plain words', async () => {
    mocks.setOwnedRecordPinned.mockResolvedValue({
      ok: false,
      error: { code: '42501' },
    });

    await expect(setDashboardPinned(ID, true)).resolves.toMatchObject({
      ok: false,
      error: expect.stringContaining('Try again'),
    });
  });

  it('does nothing in fixture mode', async () => {
    mocks.fixtureModeEnabled.mockReturnValue(true);

    await expect(setDashboardPinned(ID, true)).resolves.toEqual({
      ok: false,
      error: 'Saving is off in fixture mode.',
    });
    expect(mocks.setOwnedRecordPinned).not.toHaveBeenCalled();
  });
});

describe('setDashboardPinned caller identity', () => {
  it('tells the caller to try again when the provider is unreachable', async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: new AuthRetryableFetchError('fetch failed', 0),
    });

    await expect(setDashboardPinned(ID, true)).resolves.toEqual({
      ok: false,
      error: 'Could not save your changes. Try again.',
    });
    expect(mocks.setOwnedRecordPinned).not.toHaveBeenCalled();
  });

  it('asks a signed-out caller to sign in again and logs it by code only', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });

    await expect(setDashboardPinned(ID, true)).resolves.toEqual({
      ok: false,
      error: 'Sign in again to update your profile.',
      signedOut: true,
    });
    expect(console.warn).toHaveBeenCalledWith('getCallerIdentity failed', {
      code: undefined,
      status: undefined,
    });
    expect(mocks.setOwnedRecordPinned).not.toHaveBeenCalled();
  });
});
