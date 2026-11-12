/*
 * Account deletion through real signed-in clients on the disposable stack
 * (`pnpm --filter @synapcity/server-account test:db`): the files are all gone
 * before the account is, Auth then answers `user_not_found` for the old token
 * for another live session (what the resolver relies on), a retry reports the deletion, and a session
 * without a recent emailed-link sign-in changes nothing.
 *
 * Deleting needs an emailed-link sign-in, so each test signs the harness user
 * in again through a magic link minted with the stack's service key (test
 * provisioning only; the code under test never sees that key).
 */
import {
  createRequestClient,
  readProviderUser,
  type RequestCookies,
  type SupabaseServerClient,
} from '@synapcity/server-supabase';
import {
  stackEnv,
  withTwoUsers,
  type TestUser,
} from '@synapcity/server-data/testing';
import { describe, expect, it } from 'vitest';

import { httpsPublicUrls } from '../testing/https-public-urls';
import { deleteOwnAccount } from './delete-own-account';

const PNG = Uint8Array.from(
  atob(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  ),
  (c) => c.charCodeAt(0),
);
const png = () => new Blob([PNG], { type: 'image/png' });

function cookieJar(): RequestCookies {
  const jar = new Map<string, string>();
  return {
    getAll: () => [...jar].map(([name, value]) => ({ name, value })),
    set: (name, value) => void jar.set(name, value),
  };
}

/** A new session for `user`, signed in by an emailed (magic) link just now. */
async function linkSession(user: TestUser): Promise<SupabaseServerClient> {
  const env = stackEnv();
  const response = await fetch(`${env.apiUrl}/auth/v1/admin/generate_link`, {
    method: 'POST',
    headers: {
      apikey: env.serviceKey,
      Authorization: `Bearer ${env.serviceKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ type: 'magiclink', email: user.email }),
  });
  if (!response.ok) throw new Error(`generate_link: ${response.status}`);
  const link = (await response.json()) as {
    hashed_token?: string;
    properties?: { hashed_token?: string };
  };
  const tokenHash = link.properties?.hashed_token ?? link.hashed_token;
  if (!tokenHash) throw new Error('generate_link returned no token');

  const client = createRequestClient({
    url: env.apiUrl,
    publishableKey: env.publishableKey,
    cookies: cookieJar(),
  });
  const { error } = await client.auth.verifyOtp({
    token_hash: tokenHash,
    type: 'magiclink',
  });
  if (error) throw new Error(`verifyOtp: ${error.code}`);
  return client;
}

/** Every object under the user's folder, seen with the service key. */
async function objectsOf(userId: string): Promise<string[]> {
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
  const entries = (await response.json()) as { name: string }[];
  return entries.map((entry) => entry.name);
}

async function uploadMany(
  client: SupabaseServerClient,
  userId: string,
  count: number,
) {
  for (let i = 0; i < count; i += 1) {
    const { error } = await client.storage
      .from('avatars')
      .upload(`${userId}/${String(i).padStart(3, '0')}.png`, png());
    if (error) throw new Error(`upload ${i}: ${error.message}`);
  }
}

describe('deleteOwnAccount on the stack', () => {
  it('removes every file, then the account; another live session then reads user_not_found, and a retry on it reports the deletion', async () => {
    await withTwoUsers(async (a, b) => {
      const client = httpsPublicUrls(await linkSession(a));
      // A second session of the same person, as a retry from another request
      // whose answer was lost would hold.
      const other = await linkSession(a);
      await uploadMany(client, a.id, 2);
      const url = client.storage.from('avatars').getPublicUrl(`${a.id}/000.png`)
        .data.publicUrl;
      const { error } = await client
        .from('profiles')
        .update({ avatar_url: url })
        .eq('id', a.id);
      expect(error).toBeNull();
      await uploadMany(b.client, b.id, 1);

      expect(await deleteOwnAccount(client)).toEqual({ kind: 'deleted' });

      expect(await objectsOf(a.id)).toEqual([]);
      // The other person's file is untouched.
      expect(await objectsOf(b.id)).toHaveLength(1);

      // The resolver's assumption: a still-valid token of the deleted user
      // reads as user_not_found.
      expect(await readProviderUser(other)).toMatchObject({
        kind: 'signed-out',
        failure: { code: 'user_not_found' },
      });

      // Trying again from that session still reports the deletion.
      expect(await deleteOwnAccount(other)).toEqual({ kind: 'deleted' });
    });
  });

  it('removes more than one page of files', async () => {
    await withTwoUsers(async (a) => {
      const client = await linkSession(a);
      await uploadMany(client, a.id, 105);

      expect((await deleteOwnAccount(client)).kind).toBe('deleted');
      expect(await objectsOf(a.id)).toEqual([]);
    });
  });

  it('changes nothing for a session without a recent emailed-link sign-in', async () => {
    await withTwoUsers(async (a) => {
      await uploadMany(a.client, a.id, 1);

      expect(await deleteOwnAccount(a.client)).toEqual({
        kind: 'link-required',
        photoRemoved: false,
      });
      expect(await objectsOf(a.id)).toHaveLength(1);
      const { data } = await a.client
        .from('profiles')
        .select('account_deletion_started_at')
        .eq('id', a.id)
        .single();
      expect(data?.account_deletion_started_at).toBeNull();
    });
  });
});
