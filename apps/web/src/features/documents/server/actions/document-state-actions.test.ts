import { AuthRetryableFetchError } from '@supabase/supabase-js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  setRecordPinned: vi.fn(),
  fixtureModeEnabled: vi.fn(() => false),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ auth: { getUser: mocks.getUser } }),
}));
vi.mock('@/lib/access/dev-fixture', () => ({
  FIXTURE_MESSAGE: 'Saving is off in fixture mode.',
  fixtureModeEnabled: mocks.fixtureModeEnabled,
}));
vi.mock('@synapcity/server-data', () => ({
  setRecordPinned: mocks.setRecordPinned,
}));

import { setDocumentPinned } from './document-state-actions';

const ID = '9ab8c032-8759-44e9-808d-0573d13f290e';

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  mocks.fixtureModeEnabled.mockReturnValue(false);
  mocks.getUser.mockResolvedValue({
    data: { user: { id: 'user-1' } },
    error: null,
  });
  mocks.setRecordPinned.mockResolvedValue({
    ok: true,
    pinnedAt: '2026-10-18T12:00:00+00:00',
  });
});

describe('setDocumentPinned', () => {
  it('pins the document and reports the time the database stamped', async () => {
    await expect(setDocumentPinned(ID, true)).resolves.toEqual({
      ok: true,
      pinnedAt: '2026-10-18T12:00:00+00:00',
    });
    expect(mocks.setRecordPinned).toHaveBeenCalledWith(
      expect.anything(),
      'documents',
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
    await expect(setDocumentPinned(id, pin)).resolves.toMatchObject({
      ok: false,
    });
    expect(mocks.getUser).not.toHaveBeenCalled();
    expect(mocks.setRecordPinned).not.toHaveBeenCalled();
  });

  it('reports signed-out callers', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });

    await expect(setDocumentPinned(ID, true)).resolves.toMatchObject({
      ok: false,
      signedOut: true,
    });
    expect(mocks.setRecordPinned).not.toHaveBeenCalled();
  });

  it('reports a failed save in plain words', async () => {
    mocks.setRecordPinned.mockResolvedValue({
      ok: false,
      error: { code: '42501' },
    });

    await expect(setDocumentPinned(ID, true)).resolves.toMatchObject({
      ok: false,
      error: expect.stringContaining('Try again'),
    });
  });

  it('does nothing in fixture mode', async () => {
    mocks.fixtureModeEnabled.mockReturnValue(true);

    await expect(setDocumentPinned(ID, true)).resolves.toEqual({
      ok: false,
      error: 'Saving is off in fixture mode.',
    });
    expect(mocks.setRecordPinned).not.toHaveBeenCalled();
  });
});

describe('setDocumentPinned caller identity', () => {
  it('tells the caller to try again when the provider is unreachable', async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: new AuthRetryableFetchError('fetch failed', 0),
    });

    await expect(setDocumentPinned(ID, true)).resolves.toEqual({
      ok: false,
      error: 'Could not save your changes. Try again.',
    });
    expect(mocks.setRecordPinned).not.toHaveBeenCalled();
  });

  it('asks a signed-out caller to sign in again and logs it by code only', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });

    await expect(setDocumentPinned(ID, true)).resolves.toEqual({
      ok: false,
      error: 'Sign in again to save your changes.',
      signedOut: true,
    });
    expect(console.warn).toHaveBeenCalledWith('getCallerIdentity failed', {
      code: undefined,
      status: undefined,
    });
    expect(mocks.setRecordPinned).not.toHaveBeenCalled();
  });
});
