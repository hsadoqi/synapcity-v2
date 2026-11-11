/*
 * saveAvatar through a real signed-in client on the disposable stack
 * (`pnpm --filter @synapcity/server-account test:db`): the compare-and-set
 * write and its deletion filter as PostgREST really parses them, two saves at
 * once, the deletion marker, and the created_at bound the orphan sweep relies
 * on. URLs are made https for the profile's column check (see
 * `httpsPublicUrls`).
 */
import { stackEnv, withTwoUsers } from '@synapcity/server-data/testing';
import type { ProviderUser } from '@synapcity/server-supabase';
import { describe, expect, it } from 'vitest';

import { httpsPublicUrls } from '../../testing/https-public-urls';
import { saveAvatar } from './save-avatar';

const PNG = Uint8Array.from(
  atob(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  ),
  (c) => c.charCodeAt(0),
);
const pngFile = () => new File([PNG], 'me.png', { type: 'image/png' });
const upload = () => ({ kind: 'upload' as const, file: pngFile() });

async function objectsOf(
  userId: string,
): Promise<{ name: string; created_at: string }[]> {
  const env = stackEnv();
  const response = await fetch(`${env.apiUrl}/storage/v1/object/list/avatars`, {
    method: 'POST',
    headers: {
      apikey: env.serviceKey,
      Authorization: `Bearer ${env.serviceKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ prefix: `${userId}/`, limit: 1000 }),
  });
  if (!response.ok) throw new Error(`list: ${response.status}`);
  return (await response.json()) as { name: string; created_at: string }[];
}

const asUser = (id: string): ProviderUser => ({ id, identities: [] });

describe('saveAvatar on the stack', () => {
  it('records an upload, replaces it with the next and leaves only the current file', async () => {
    await withTwoUsers(async (a) => {
      const before = Date.now();
      const first = await saveAvatar(
        httpsPublicUrls(a.client),
        asUser(a.id),
        upload(),
      );
      const second = await saveAvatar(
        httpsPublicUrls(a.client),
        asUser(a.id),
        upload(),
      );

      expect(first.ok && second.ok).toBe(true);
      const objects = await objectsOf(a.id);
      expect(objects).toHaveLength(1);
      expect(second.ok && second.avatarUrl).toContain(objects[0]!.name);
      // The orphan sweep's bound: an object is never older than the request
      // that uploaded it (a second of slack for the two clocks).
      expect(Date.parse(objects[0]!.created_at)).toBeGreaterThanOrEqual(
        before - 1000,
      );
    });
  });

  it('two saves at once end on one existing picture, with no file left behind', async () => {
    await withTwoUsers(async (a) => {
      const results = await Promise.all([
        saveAvatar(httpsPublicUrls(a.client), asUser(a.id), upload()),
        saveAvatar(httpsPublicUrls(a.client), asUser(a.id), upload()),
      ]);

      expect(results.some((result) => result.ok)).toBe(true);
      const { data } = await a.client
        .from('profiles')
        .select('avatar_url')
        .eq('id', a.id)
        .single();
      const objects = await objectsOf(a.id);
      expect(objects).toHaveLength(1);
      expect(data?.avatar_url).toContain(`${a.id}/${objects[0]!.name}`);
    });
  });

  it('saves nothing while a deletion marker is set, and Storage refuses the upload itself', async () => {
    await withTwoUsers(async (a) => {
      await a.client
        .from('profiles')
        .update({ account_deletion_started_at: new Date().toISOString() })
        .eq('id', a.id);

      expect(
        await saveAvatar(httpsPublicUrls(a.client), asUser(a.id), upload()),
      ).toEqual({
        ok: false,
        reason: 'account-deleting',
      });
      const direct = await a.client.storage
        .from('avatars')
        .upload(`${a.id}/direct.png`, pngFile());
      expect(direct.error).not.toBeNull();
      expect(await objectsOf(a.id)).toEqual([]);

      // Cleared (as an expired marker reads), saving works again.
      await a.client
        .from('profiles')
        .update({ account_deletion_started_at: null })
        .eq('id', a.id);
      expect(
        (await saveAvatar(httpsPublicUrls(a.client), asUser(a.id), upload()))
          .ok,
      ).toBe(true);
    });
  });
});
