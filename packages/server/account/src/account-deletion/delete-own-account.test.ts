import { describe, expect, it } from 'vitest';

import {
  fakeAccountStore,
  holdAt,
  PUBLIC_BASE,
  type FakeObject,
  type FakeRow,
} from '../testing/fake-account-client';
import { deleteOwnAccount } from './delete-own-account';

const T0 = Date.parse('2026-11-11T12:00:00Z');
const NOW_S = Math.floor(T0 / 1000);
const freshClaims = {
  sub: 'u1',
  amr: [{ method: 'otp', timestamp: NOW_S - 30 }],
};
const staleClaims = {
  sub: 'u1',
  amr: [{ method: 'otp', timestamp: NOW_S - 3600 }],
};
const google = {
  id: 'u1',
  identities: [
    { provider: 'google', identity_data: { picture: 'https://g.test/p.png' } },
  ],
};
const uploaded = `${PUBLIC_BASE}u1/mine.png`;
const MINUTE = 60_000;

function setup(
  options: {
    row?: FakeRow | null;
    objects?: FakeObject[];
    claims?: Record<string, unknown> | null;
  } = {},
) {
  const store = fakeAccountStore({
    userId: 'u1',
    row:
      options.row === undefined
        ? { avatar_url: uploaded, account_deletion_started_at: null }
        : options.row,
    objects: options.objects ?? [
      { path: 'u1/mine.png', createdAt: T0 - MINUTE },
      { path: 'u1/orphan.webp', createdAt: T0 - 90 * MINUTE },
    ],
    claims: options.claims === undefined ? freshClaims : options.claims,
    now: () => T0,
    user: google,
  });
  return {
    ...store,
    clock: () => T0,
    objectPaths: () => [...store.state.objects.keys()].sort(),
  };
}

const timeout = { code: '57014', message: 'canceling statement', status: 500 };
const lostAnswer = { message: 'fetch failed', status: 0 };

describe('deleteOwnAccount', () => {
  it('marks, detaches, removes every file, deletes, sweeps again and signs out, in that order', async () => {
    const f = setup();

    expect(await deleteOwnAccount(f.client, f.clock)).toEqual({
      kind: 'deleted',
    });

    expect(f.state.accountExists).toBe(false);
    expect(f.objectPaths()).toEqual([]);
    const order = f.state.calls.filter((c) =>
      [
        'profiles.update',
        'storage.remove',
        'rpc.delete_own_account',
        'auth.signOut',
      ].includes(c),
    );
    expect(order).toEqual([
      'profiles.update',
      'storage.remove',
      'rpc.delete_own_account',
      'auth.signOut',
    ]);
  });

  it('removes files in sub-folders and more than one page of them', async () => {
    const many = Array.from({ length: 150 }, (_, i) => ({
      path: `u1/${String(i).padStart(3, '0')}.png`,
      createdAt: T0 - MINUTE,
    }));
    const f = setup({
      objects: [...many, { path: 'u1/nested/deep.png', createdAt: T0 }],
    });

    expect((await deleteOwnAccount(f.client, f.clock)).kind).toBe('deleted');
    expect(f.objectPaths()).toEqual([]);
  });

  it('F1: tells a missing session from an outage, and changes nothing', async () => {
    const signedOut = setup({ claims: null });
    expect(await deleteOwnAccount(signedOut.client, signedOut.clock)).toEqual({
      kind: 'signed-out',
    });

    const outage = setup();
    outage.fail('auth.getClaims', {
      name: 'AuthRetryableFetchError',
      status: 0,
    });
    expect((await deleteOwnAccount(outage.client, outage.clock)).kind).toBe(
      'unavailable',
    );
    for (const f of [signedOut, outage]) {
      expect(f.state.calls).not.toContain('profiles.update');
      expect(f.state.accountExists).toBe(true);
    }
  });

  it('F2: needs a recent emailed-link sign-in before anything changes', async () => {
    const f = setup({ claims: staleClaims });

    expect(await deleteOwnAccount(f.client, f.clock)).toEqual({
      kind: 'link-required',
      photoRemoved: false,
    });
    expect(f.state.calls).not.toContain('profiles.update');
  });

  it('F3: a failed detach changes nothing', async () => {
    const f = setup();
    f.fail('profiles.update', { code: '42501', status: 403 });

    expect(await deleteOwnAccount(f.client, f.clock)).toEqual({
      kind: 'failed',
      step: 'detach',
      photoRemoved: false,
      failure: { code: '42501', status: 403 },
    });
    expect(f.state.row?.avatar_url).toBe(uploaded);
    expect(f.objectPaths()).toHaveLength(2);
    expect(f.state.calls).not.toContain('rpc.delete_own_account');
  });

  it('F4: a missing profile row is a deletion only if Auth confirms the account is gone', async () => {
    const gone = setup({ row: null });
    gone.state.accountExists = false;
    expect(await deleteOwnAccount(gone.client, gone.clock)).toEqual({
      kind: 'deleted',
    });

    const anomaly = setup({ row: null });
    expect(await deleteOwnAccount(anomaly.client, anomaly.clock)).toMatchObject(
      {
        kind: 'failed',
        step: 'detach',
      },
    );
    expect(anomaly.state.calls).not.toContain('rpc.delete_own_account');
  });

  it('F5: when a file cannot be removed it stops, the account stays, and its picture no longer points at a removed file', async () => {
    const f = setup();
    f.fail('storage.remove', { statusCode: '500', message: 'storage down' });

    const outcome = await deleteOwnAccount(f.client, f.clock);

    expect(outcome).toMatchObject({
      kind: 'failed',
      step: 'files',
      photoRemoved: true,
    });
    expect(f.state.accountExists).toBe(true);
    expect(f.state.row?.avatar_url).toBe('https://g.test/p.png');
    expect(f.state.row?.account_deletion_started_at).not.toBeNull();
    expect(f.state.calls).not.toContain('rpc.delete_own_account');
  });

  it('F5: a retry marks again, sweeps again and finishes', async () => {
    const f = setup();
    f.fail('storage.remove', { statusCode: '500', message: 'storage down' });
    await deleteOwnAccount(f.client, f.clock);

    expect(await deleteOwnAccount(f.client, f.clock)).toEqual({
      kind: 'deleted',
    });
    expect(f.objectPaths()).toEqual([]);
  });

  it('F6: when the database refuses the link, the account stays and the message can say the photo went', async () => {
    const f = setup();
    f.fail('rpc.delete_own_account', { code: '42501', status: 403 });

    expect(await deleteOwnAccount(f.client, f.clock)).toEqual({
      kind: 'link-required',
      photoRemoved: true,
    });
    expect(f.state.accountExists).toBe(true);
    expect(f.state.calls).not.toContain('auth.signOut');
  });

  it('F7: a timeout that rolled back is resolved as a failure, never assumed', async () => {
    const f = setup();
    f.fail('rpc.delete_own_account', timeout);
    f.fail('rpc.delete_own_account', timeout);

    expect(await deleteOwnAccount(f.client, f.clock)).toMatchObject({
      kind: 'failed',
      step: 'delete',
      photoRemoved: true,
      failure: { code: '57014' },
    });
    expect(f.state.accountExists).toBe(true);
    expect(f.state.calls).toContain('auth.getUser');
  });

  it('F7: a timeout followed by a successful second call is a deletion', async () => {
    const f = setup();
    f.fail('rpc.delete_own_account', timeout);

    expect((await deleteOwnAccount(f.client, f.clock)).kind).toBe('deleted');
    expect(f.state.accountExists).toBe(false);
  });

  it('F8: a lost answer that did commit is confirmed through Auth', async () => {
    const f = setup();
    f.fail('rpc.delete_own_account', lostAnswer, true);
    // The second call, on a token whose user is gone, cannot be answered.
    f.fail('rpc.delete_own_account', lostAnswer);

    expect((await deleteOwnAccount(f.client, f.clock)).kind).toBe('deleted');
  });

  it('F8: when neither the function nor Auth can answer, the outcome is unconfirmed', async () => {
    const f = setup();
    f.fail('rpc.delete_own_account', lostAnswer);
    f.fail('rpc.delete_own_account', lostAnswer);
    // The first getUser reads the fallback picture; the second is the check.
    const outage = { name: 'AuthRetryableFetchError', status: 0 };
    let users = 0;
    const flaky = f.clientWith((label) => {
      if (label === 'auth.getUser' && ++users === 2) {
        f.fail('auth.getUser', outage);
      }
    });

    expect(await deleteOwnAccount(flaky, f.clock)).toMatchObject({
      kind: 'unconfirmed',
    });
  });

  it('F9: a request that dies after marking leaves a usable account once the marker expires', async () => {
    const f = setup();
    const held = holdAt('storage.list');
    void deleteOwnAccount(f.clientWith(held.gate), f.clock);
    await held.reached; // marked and detached; the request "dies" here.

    expect(f.state.accountExists).toBe(true);
    expect(f.state.row?.avatar_url).toBe('https://g.test/p.png');
    const marker = Date.parse(f.state.row!.account_deletion_started_at!);
    expect(T0 + 15 * MINUTE - marker).toBe(15 * MINUTE);
  });

  it('F11: a failed sweep after deletion is still a deletion, with the failure for the log', async () => {
    const f = setup();
    let lists = 0;
    const client = f.clientWith((label) => {
      // The sweep before deletion lists twice (found, then empty); the third
      // list is the sweep after it.
      if (label === 'storage.list' && ++lists === 3) {
        f.fail('storage.list', { status: 500, message: 'gone' });
      }
    });

    expect(await deleteOwnAccount(client, f.clock)).toEqual({
      kind: 'deleted',
      cleanupFailure: { status: 500 },
    });
  });

  it('F12: a retry after a deletion whose answer was lost reports the deletion', async () => {
    const f = setup();
    await deleteOwnAccount(f.client, f.clock);

    expect(await deleteOwnAccount(f.client, f.clock)).toEqual({
      kind: 'deleted',
    });
  });

  it('S6: an avatar save that commits during the deletion is detached and swept, never left behind', async () => {
    const f = setup({
      row: { avatar_url: null, account_deletion_started_at: null },
      objects: [],
    });
    // A save committed u1/late.png just before the deletion marked the row.
    f.state.objects.set('u1/late.png', { path: 'u1/late.png', createdAt: T0 });
    f.state.row!.avatar_url = `${PUBLIC_BASE}u1/late.png`;

    expect((await deleteOwnAccount(f.client, f.clock)).kind).toBe('deleted');
    expect(f.objectPaths()).toEqual([]);
  });
});
