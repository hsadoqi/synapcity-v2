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
  upsert: vi.fn(),
  revalidatePath: vi.fn(),
  fixtureModeEnabled: vi.fn(() => false),
}));

vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }));
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

import {
  addDashboardToSpace,
  addDocumentToSpace,
  recordSpaceView,
  setSpacePinned,
} from './space-state-actions';

const ID = '9ab8c032-8759-44e9-808d-0573d13f290e';
const ITEM_ID = '5d1f7c0e-3b0a-4f3e-9d57-0a1b2c3d4e5f';

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
  mocks.upsert.mockResolvedValue({ error: null, status: 201 });
  mocks.from.mockReturnValue({ update: mocks.update, upsert: mocks.upsert });
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
      error: 'Sign in again to save your changes.',
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

const ADD_ACTIONS = [
  {
    kind: 'document',
    add: addDocumentToSpace,
    table: 'space_documents',
    column: 'document_id',
  },
  {
    kind: 'dashboard',
    add: addDashboardToSpace,
    table: 'space_dashboards',
    column: 'dashboard_id',
  },
] as const;

describe.each(ADD_ACTIONS)(
  'add $kind to space',
  ({ kind, add, table, column }) => {
    it('adds the pair through the Space source and refreshes the caller’s home', async () => {
      await expect(add(ID, ITEM_ID)).resolves.toEqual({ ok: true });

      expect(mocks.from).toHaveBeenCalledWith(table);
      expect(mocks.upsert).toHaveBeenCalledWith(
        { space_id: ID, [column]: ITEM_ID },
        { onConflict: `space_id,${column}`, ignoreDuplicates: true },
      );
      expect(mocks.revalidatePath).toHaveBeenCalledExactlyOnceWith(
        '/user-1/home',
        'layout',
      );
    });

    it('treats an item already in the space as added, without touching it', async () => {
      await add(ID, ITEM_ID);
      await expect(add(ID, ITEM_ID)).resolves.toEqual({ ok: true });

      // Only inserts, never an update that could reset its pin or position.
      expect(mocks.upsert).toHaveBeenCalledTimes(2);
      expect(mocks.update).not.toHaveBeenCalled();
    });

    it('records no view of the space', async () => {
      await add(ID, ITEM_ID);

      expect(mocks.update).not.toHaveBeenCalled();
      expect(mocks.from).not.toHaveBeenCalledWith('spaces');
    });

    it('verifies the caller with a fresh lookup, as this is a write', async () => {
      await add(ID, ITEM_ID);

      expect(mocks.getUser).toHaveBeenCalled();
      expect(mocks.getClaims).not.toHaveBeenCalled();
    });

    it.each([
      ['not-a-uuid', ITEM_ID],
      [ID, 'not-a-uuid'],
      [42, ITEM_ID],
      [ID, undefined],
      [{ id: ID }, ITEM_ID],
    ])(
      'rejects bad ids (%j, %j) without calling Supabase',
      async (space, item) => {
        await expect(add(space, item)).resolves.toEqual({
          ok: false,
          error: 'Could not save your changes. Try again.',
        });
        expect(mocks.getUser).not.toHaveBeenCalled();
        expect(mocks.upsert).not.toHaveBeenCalled();
        expect(mocks.revalidatePath).not.toHaveBeenCalled();
      },
    );

    it('asks a signed-out caller to sign in again', async () => {
      mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });

      await expect(add(ID, ITEM_ID)).resolves.toEqual({
        ok: false,
        error: 'Sign in again to save your changes.',
        signedOut: true,
      });
      expect(mocks.upsert).not.toHaveBeenCalled();
      expect(mocks.revalidatePath).not.toHaveBeenCalled();
    });

    it('tells the caller to try again when the provider is unreachable', async () => {
      mocks.getUser.mockResolvedValue({
        data: { user: null },
        error: new AuthRetryableFetchError('fetch failed', 0),
      });

      await expect(add(ID, ITEM_ID)).resolves.toEqual({
        ok: false,
        error: 'Could not save your changes. Try again.',
      });
      expect(mocks.upsert).not.toHaveBeenCalled();
    });

    it('reports someone else’s space or item as a failure and logs the code only', async () => {
      mocks.upsert.mockResolvedValue({
        error: {
          code: '42501',
          message: 'new row violates row-level security policy',
        },
        status: 403,
      });

      await expect(add(ID, ITEM_ID)).resolves.toEqual({
        ok: false,
        error: 'Could not save your changes. Try again.',
      });
      expect(console.warn).toHaveBeenCalledWith('addToSpace failed', {
        kind,
        code: '42501',
        status: 403,
      });
      expect(mocks.revalidatePath).not.toHaveBeenCalled();
    });

    it('reports a database failure without refreshing anything', async () => {
      mocks.upsert.mockResolvedValue({ error: { code: '23503' }, status: 409 });

      await expect(add(ID, ITEM_ID)).resolves.toMatchObject({ ok: false });
      expect(mocks.revalidatePath).not.toHaveBeenCalled();
    });

    it('refreshes after a cut-off request, as the row may have been written', async () => {
      mocks.upsert.mockResolvedValue({
        error: { message: 'fetch failed' },
        status: 0,
      });

      await expect(add(ID, ITEM_ID)).resolves.toMatchObject({ ok: false });
      expect(mocks.revalidatePath).toHaveBeenCalledWith(
        '/user-1/home',
        'layout',
      );
    });

    it('does nothing in fixture mode', async () => {
      mocks.fixtureModeEnabled.mockReturnValue(true);

      await expect(add(ID, ITEM_ID)).resolves.toEqual({
        ok: false,
        error: 'Saving is off in fixture mode.',
      });
      expect(mocks.getUser).not.toHaveBeenCalled();
      expect(mocks.upsert).not.toHaveBeenCalled();
    });
  },
);
