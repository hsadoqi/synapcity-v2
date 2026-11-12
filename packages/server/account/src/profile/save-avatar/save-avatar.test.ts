import { describe, expect, it } from 'vitest';
import type { ProviderUser } from '@synapcity/server-supabase';

import {
  fakeAccountStore,
  holdAt,
  PUBLIC_BASE,
  type FakeObject,
  type FakeRow,
} from '../../testing/fake-account-client';
import { ORPHAN_MIN_AGE_MS } from './avatar-objects';
import { saveAvatar } from '.';

const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3];
const user: ProviderUser = { id: 'u1', user_metadata: {}, identities: [] };
const withGoogle: ProviderUser = {
  id: 'u1',
  identities: [
    { provider: 'google', identity_data: { picture: 'https://g.test/p.png' } },
  ],
};
const T0 = Date.parse('2026-11-11T12:00:00Z');
const MINUTE = 60_000;

const pngFile = () =>
  new File([new Uint8Array(PNG)], 'a.png', { type: 'image/png' });
const upload = () => ({ kind: 'upload' as const, file: pngFile() });
const url = (path: string) => `${PUBLIC_BASE}${path}`;
const pathOf = (avatarUrl: string | null) =>
  avatarUrl?.startsWith(PUBLIC_BASE)
    ? avatarUrl.slice(PUBLIC_BASE.length)
    : null;

function setup(
  options: { row?: FakeRow | null; objects?: FakeObject[]; now?: number } = {},
) {
  let now = options.now ?? T0;
  const store = fakeAccountStore({
    userId: 'u1',
    row: options.row,
    objects: options.objects,
    now: () => now,
  });
  return {
    ...store,
    clock: () => now,
    advance: (ms: number) => {
      now += ms;
    },
    /** A-I1: the row's uploaded picture, if any, exists in the bucket. */
    referencedExists() {
      const path = pathOf(store.state.row?.avatar_url ?? null);
      return path === null || store.state.objects.has(path);
    },
    objectPaths: () => [...store.state.objects.keys()].sort(),
  };
}

const row = (avatarUrl: string | null, marker: string | null = null) => ({
  avatar_url: avatarUrl,
  account_deletion_started_at: marker,
});

describe('saveAvatar', () => {
  it("uploads to the caller's own folder, typed from the bytes, for an hour of caching, and records the picture", async () => {
    const f = setup();

    const saved = await saveAvatar(f.client, user, upload(), f.clock);

    expect(saved.ok).toBe(true);
    if (!saved.ok) return;
    const [{ path, cacheControl }] = f.state.uploads as [
      { path: string; cacheControl?: string },
    ];
    expect(path).toMatch(/^u1\/[0-9a-f-]+\.png$/);
    expect(cacheControl).toBe('3600');
    expect(saved.avatarUrl).toBe(url(path));
    expect(f.state.row?.avatar_url).toBe(url(path));
    expect(saved.patch({ avatar_url: 'x' })).toEqual({
      avatar_url: saved.avatarUrl,
    });
  });

  it('removes the picture it replaced, keeps young unreferenced files, and removes aged orphans', async () => {
    const f = setup({
      row: row(url('u1/old.png')),
      objects: [
        { path: 'u1/old.png', createdAt: T0 - 5 * MINUTE },
        // Could belong to a save still in progress: too young to remove.
        { path: 'u1/young.png', createdAt: T0 - 10 * MINUTE },
        // Left by a save that died long ago.
        { path: 'u1/stale.png', createdAt: T0 - ORPHAN_MIN_AGE_MS - MINUTE },
      ],
    });

    const saved = await saveAvatar(f.client, user, upload(), f.clock);

    const added = f.state.uploads[0]!.path;
    expect(saved.ok).toBe(true);
    expect(f.objectPaths()).toEqual([added, 'u1/young.png'].sort());
    expect(f.referencedExists()).toBe(true);
  });

  it('removing returns to the provider picture, or none, and removes the uploaded file', async () => {
    const a = setup({
      row: row(url('u1/mine.png')),
      objects: [{ path: 'u1/mine.png', createdAt: T0 - MINUTE }],
    });
    const b = setup({ row: row(null) });

    const fromProvider = await saveAvatar(
      a.client,
      withGoogle,
      { kind: 'remove' },
      a.clock,
    );
    const none = await saveAvatar(b.client, user, { kind: 'remove' }, b.clock);

    expect(fromProvider).toMatchObject({
      ok: true,
      avatarUrl: 'https://g.test/p.png',
    });
    expect(a.objectPaths()).toEqual([]);
    expect(none).toMatchObject({ ok: true, avatarUrl: null });
    expect(a.state.uploads).toEqual([]);
  });

  it("refuses a file the schema rejects, with the schema's own words, before any request", async () => {
    const f = setup();

    const saved = await saveAvatar(
      f.client,
      user,
      { kind: 'upload', file: undefined },
      f.clock,
    );

    expect(saved).toMatchObject({
      ok: false,
      reason: 'invalid-file',
      message: 'Choose an image.',
    });
    expect(f.state.calls).toEqual([]);
  });

  it('refuses bytes that are not a PNG, JPEG or WebP, whatever the browser claimed', async () => {
    const f = setup();
    const svg = new File(['<svg></svg>'], 'a.png', { type: 'image/png' });

    const saved = await saveAvatar(
      f.client,
      user,
      { kind: 'upload', file: svg },
      f.clock,
    );

    expect(saved).toEqual({ ok: false, reason: 'unsupported-type' });
    expect(f.state.calls).toEqual([]);
  });

  it('reports a failed upload by code and status only, and records nothing', async () => {
    const f = setup({ row: row(null) });
    f.fail('storage.upload', { code: 'quota', status: 413, message: 'secret' });

    const saved = await saveAvatar(f.client, user, upload(), f.clock);

    expect(saved).toEqual({
      ok: false,
      reason: 'upload-failed',
      failure: { code: 'quota', status: 413 },
    });
    expect(f.state.row?.avatar_url).toBeNull();
  });

  it('removes its uploaded file when the database refuses the change', async () => {
    const f = setup();
    f.fail('profiles.update', { code: '23514', status: 400 });

    const saved = await saveAvatar(f.client, user, upload(), f.clock);

    expect(saved).toEqual({
      ok: false,
      reason: 'profile-not-saved',
      failure: { code: '23514', status: 400 },
    });
    expect(f.objectPaths()).toEqual([]);
  });

  it('does not look saved when there is no profile row, and uploads nothing', async () => {
    const f = setup({ row: null });

    await expect(
      saveAvatar(f.client, user, upload(), f.clock),
    ).resolves.toEqual({
      ok: false,
      reason: 'profile-not-saved',
      failure: { code: 'profile_row_missing' },
    });
    expect(f.state.uploads).toEqual([]);
  });

  describe('while an account deletion is under way', () => {
    it('uploads nothing when the marker is already set', async () => {
      const f = setup({
        row: row(null, new Date(T0 - MINUTE).toISOString()),
      });

      const saved = await saveAvatar(f.client, user, upload(), f.clock);

      expect(saved).toEqual({ ok: false, reason: 'account-deleting' });
      expect(f.state.calls).not.toContain('storage.upload');
    });

    it('saves again once the marker has expired', async () => {
      const f = setup({
        row: row(null, new Date(T0 - 16 * MINUTE).toISOString()),
      });

      const saved = await saveAvatar(f.client, user, upload(), f.clock);

      expect(saved.ok).toBe(true);
    });

    it('reports the deletion when Storage refuses the upload because of it (S6, marker before upload)', async () => {
      const f = setup({ row: row(null) });
      const held = holdAt('storage.upload');
      const saving = saveAvatar(
        f.clientWith(held.gate),
        user,
        upload(),
        f.clock,
      );
      await held.reached;
      f.state.row!.account_deletion_started_at = new Date(T0).toISOString();
      held.release();

      expect(await saving).toEqual({ ok: false, reason: 'account-deleting' });
      expect(f.objectPaths()).toEqual([]);
    });

    it('does not commit, and removes its file, when the marker lands between upload and commit (S6)', async () => {
      const f = setup({ row: row(null) });
      const held = holdAt('profiles.update');
      const saving = saveAvatar(
        f.clientWith(held.gate),
        user,
        upload(),
        f.clock,
      );
      await held.reached;
      // The deletion marks the row and detaches the picture.
      f.state.row!.account_deletion_started_at = new Date(T0).toISOString();
      held.release();

      expect(await saving).toEqual({ ok: false, reason: 'account-deleting' });
      expect(f.state.row?.avatar_url).toBeNull();
      expect(f.objectPaths()).toEqual([]);
    });
  });

  describe('when the answer to the commit is lost', () => {
    it('is saved if the row now records its own file', async () => {
      const f = setup({ row: row(null) });
      f.fail('profiles.update', { message: 'fetch failed', status: 0 }, true);

      const saved = await saveAvatar(f.client, user, upload(), f.clock);

      expect(saved.ok).toBe(true);
      expect(f.referencedExists()).toBe(true);
    });

    it('is unconfirmed, and keeps its file, if the row does not record it', async () => {
      const f = setup({ row: row(null) });
      f.fail('profiles.update', { message: 'fetch failed', status: 0 });

      const saved = await saveAvatar(f.client, user, upload(), f.clock);

      expect(saved).toMatchObject({ ok: false, reason: 'unconfirmed' });
      expect(f.objectPaths()).toEqual([f.state.uploads[0]!.path]);
    });
  });

  describe('two saves at once (the plan’s sequences)', () => {
    it('S1: both commit in turn; the later one wins and each removes only what it replaced', async () => {
      const f = setup({
        row: row(url('u1/o.png')),
        objects: [{ path: 'u1/o.png', createdAt: T0 - 2 * MINUTE }],
      });
      const holdB = holdAt('profiles.update');
      const b = saveAvatar(f.clientWith(holdB.gate), user, upload(), f.clock);
      await holdB.reached; // B read o and uploaded b; its commit waits.

      const a = await saveAvatar(f.client, user, upload(), f.clock);
      holdB.release();
      const bSaved = await b;

      expect(a.ok && bSaved.ok).toBe(true);
      const [bPath, aPath] = f.state.uploads.map((u) => u.path) as [
        string,
        string,
      ];
      expect(f.state.row?.avatar_url).toBe(url(bPath));
      expect(f.objectPaths()).toEqual([bPath]);
      expect(f.objectPaths()).not.toContain(aPath);
      expect(f.referencedExists()).toBe(true);
      // B reports and mirrors what the row holds.
      expect(bSaved.ok && bSaved.avatarUrl).toBe(url(bPath));
    });

    it('S2: a stalled save that resumes later still commits only against the current picture', async () => {
      const f = setup({
        row: row(url('u1/o.png')),
        objects: [{ path: 'u1/o.png', createdAt: T0 - 2 * MINUTE }],
      });
      const holdA = holdAt('profiles.update');
      const a = saveAvatar(f.clientWith(holdA.gate), user, upload(), f.clock);
      await holdA.reached;
      f.advance(4 * MINUTE);

      const b = await saveAvatar(f.client, user, upload(), f.clock);
      // B's sweep left A's file: it is young and may still be committed.
      const [aPath, bPath] = f.state.uploads.map((u) => u.path) as [
        string,
        string,
      ];
      expect(b.ok).toBe(true);
      expect(f.objectPaths()).toEqual([aPath, bPath].sort());

      holdA.release();
      const aSaved = await a;

      expect(aSaved.ok).toBe(true);
      expect(f.state.row?.avatar_url).toBe(url(aPath));
      expect(f.objectPaths()).toEqual([aPath]);
      expect(f.referencedExists()).toBe(true);
    });

    it('S3: a file left by a save that never committed is removed by a later save once it is old enough', async () => {
      const f = setup({
        row: row(null),
        objects: [{ path: 'u1/killed.png', createdAt: T0 }],
      });
      f.advance(ORPHAN_MIN_AGE_MS + MINUTE);

      const saved = await saveAvatar(f.client, user, upload(), f.clock);

      expect(saved.ok).toBe(true);
      expect(f.objectPaths()).toEqual([f.state.uploads[0]!.path]);
    });

    it('S5: removing and uploading at once leave the row on an existing picture', async () => {
      const f = setup({
        row: row(url('u1/o.png')),
        objects: [{ path: 'u1/o.png', createdAt: T0 - 2 * MINUTE }],
      });
      const holdA = holdAt('profiles.update');
      const a = saveAvatar(f.clientWith(holdA.gate), user, upload(), f.clock);
      await holdA.reached;

      const removed = await saveAvatar(
        f.client,
        withGoogle,
        { kind: 'remove' },
        f.clock,
      );
      expect(removed).toMatchObject({
        ok: true,
        avatarUrl: 'https://g.test/p.png',
      });

      holdA.release();
      expect((await a).ok).toBe(true);
      const aPath = f.state.uploads[0]!.path;
      expect(f.state.row?.avatar_url).toBe(url(aPath));
      expect(f.objectPaths()).toEqual([aPath]);
    });

    it('gives up with a conflict, keeping nothing of its own, when the picture keeps changing', async () => {
      const f = setup({ row: row(null) });
      let changes = 0;
      const store = f;
      const busy = f.clientWith((label) => {
        if (label === 'profiles.update') {
          changes += 1;
          store.state.row!.avatar_url = `https://g.test/other-${changes}.png`;
        }
      });

      const saved = await saveAvatar(busy, user, upload(), f.clock);

      expect(saved).toEqual({ ok: false, reason: 'conflict' });
      expect(changes).toBe(3);
      expect(f.objectPaths()).toEqual([]);
    });
  });
});
