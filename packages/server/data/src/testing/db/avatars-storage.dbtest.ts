/*
 * The avatars bucket (ADR-0006 and the avatar migration; owner decision D10: a
 * public bucket, so a URL grants read access) through real signed-in clients:
 * owner-folder writes, no cross-folder writes or deletes, listing limited to
 * the owner's own folder, public read by URL, and the bucket's type and size
 * limits. Needs the stack's Storage service (`pnpm db:stack start`).
 */
import { describe, expect, it } from 'vitest';

import { withTwoUsers } from './index';

// A real 1x1 PNG.
const PNG = Uint8Array.from(
  atob(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  ),
  (c) => c.charCodeAt(0),
);
const png = () => new Blob([PNG], { type: 'image/png' });

describe('avatars bucket', () => {
  it('lets the owner upload to their own folder and replace a file by uploading a new one and deleting the old', async () => {
    await withTwoUsers(async (a) => {
      const bucket = a.client.storage.from('avatars');
      const first = `${a.id}/first.png`;
      const second = `${a.id}/second.png`;

      expect((await bucket.upload(first, png())).error).toBeNull();
      expect((await bucket.upload(second, png())).error).toBeNull();
      expect((await bucket.remove([first])).error).toBeNull();

      const listed = await bucket.list(a.id);
      expect(listed.data?.map((f) => f.name)).toEqual(['second.png']);
      await bucket.remove([second]);
    });
  });

  it('refuses to overwrite in place: there is no update policy, so a replacement is a new name', async () => {
    await withTwoUsers(async (a) => {
      const bucket = a.client.storage.from('avatars');
      const path = `${a.id}/same.png`;
      expect((await bucket.upload(path, png())).error).toBeNull();
      const again = await bucket.upload(path, png(), { upsert: true });
      expect(again.error).not.toBeNull();
      await bucket.remove([path]);
    });
  });

  it('refuses a write or delete in someone else’s folder, and leaves their file alone', async () => {
    await withTwoUsers(async (a, b) => {
      const mine = `${a.id}/mine.png`;
      expect(
        (await a.client.storage.from('avatars').upload(mine, png())).error,
      ).toBeNull();

      // B cannot write into A's folder, or into a folder that is nobody's.
      const intoA = await b.client.storage
        .from('avatars')
        .upload(`${a.id}/planted.png`, png());
      expect(intoA.error).not.toBeNull();
      const intoRoot = await b.client.storage
        .from('avatars')
        .upload('loose.png', png());
      expect(intoRoot.error).not.toBeNull();

      // B cannot delete A's file: the call removes nothing, and the file stays public.
      const removed = await b.client.storage.from('avatars').remove([mine]);
      expect(removed.data ?? []).toEqual([]);
      const publicUrl = a.client.storage.from('avatars').getPublicUrl(mine)
        .data.publicUrl;
      expect((await fetch(publicUrl)).status).toBe(200);

      // B cannot list A's folder; A can.
      const listedByB = await b.client.storage.from('avatars').list(a.id);
      expect(listedByB.data ?? []).toEqual([]);
      const listedByA = await a.client.storage.from('avatars').list(a.id);
      expect(listedByA.data?.map((f) => f.name)).toEqual(['mine.png']);

      await a.client.storage.from('avatars').remove([mine]);
    });
  });

  it('serves a file to anyone who has its URL, without a session (D10)', async () => {
    await withTwoUsers(async (a) => {
      const path = `${a.id}/public.png`;
      expect(
        (await a.client.storage.from('avatars').upload(path, png())).error,
      ).toBeNull();

      const url = a.client.storage.from('avatars').getPublicUrl(path)
        .data.publicUrl;
      const response = await fetch(url); // no credentials
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('image/png');
      expect(new Uint8Array(await response.arrayBuffer()).length).toBe(
        PNG.length,
      );

      await a.client.storage.from('avatars').remove([path]);
    });
  });

  it('enforces the bucket’s type and size limits', async () => {
    await withTwoUsers(async (a) => {
      const bucket = a.client.storage.from('avatars');
      const svg = await bucket.upload(
        `${a.id}/x.svg`,
        new Blob(['<svg xmlns="http://www.w3.org/2000/svg"/>'], {
          type: 'image/svg+xml',
        }),
      );
      expect(svg.error).not.toBeNull();
      const text = await bucket.upload(
        `${a.id}/x.txt`,
        new Blob(['hi'], { type: 'text/plain' }),
      );
      expect(text.error).not.toBeNull();

      const big = new Blob([new Uint8Array(2 * 1024 * 1024 + 1)], {
        type: 'image/png',
      });
      const tooBig = await bucket.upload(`${a.id}/big.png`, big);
      expect(tooBig.error).not.toBeNull();

      const exactly = new Blob([new Uint8Array(2 * 1024 * 1024)], {
        type: 'image/png',
      });
      const atLimit = await bucket.upload(`${a.id}/limit.png`, exactly);
      expect(atLimit.error).toBeNull();
      await bucket.remove([`${a.id}/limit.png`]);
    });
  });
});
