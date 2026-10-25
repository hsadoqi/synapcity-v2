import { AuthApiError, AuthRetryableFetchError } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';

import type { SupabaseServerClient } from '../request-client';
import { readProviderUser } from '.';

function clientWith(result: unknown) {
  const getUser = vi.fn().mockResolvedValue(result);
  return {
    client: { auth: { getUser } } as unknown as SupabaseServerClient,
    getUser,
  };
}

describe('readProviderUser', () => {
  it('returns the provider user record for a live session', async () => {
    const user = {
      id: 'u1',
      user_metadata: { full_name: 'Ada' },
      identities: [{ provider: 'google', identity_data: { picture: 'p' } }],
    };
    const { client, getUser } = clientWith({ data: { user }, error: null });

    await expect(readProviderUser(client)).resolves.toEqual({
      kind: 'user',
      user,
    });
    expect(getUser).toHaveBeenCalledTimes(1);
  });

  it('is signed out when the provider rejects the session, keeping only the code and status', async () => {
    const { client } = clientWith({
      data: { user: null },
      error: new AuthApiError('secret detail', 403, 'session_not_found'),
    });

    const result = await readProviderUser(client);

    expect(result).toEqual({
      kind: 'signed-out',
      failure: { code: 'session_not_found', status: 403 },
    });
    expect(JSON.stringify(result)).not.toContain('secret detail');
  });

  it('is unavailable, not signed out, when the provider cannot be reached', async () => {
    const { client } = clientWith({
      data: { user: null },
      error: new AuthRetryableFetchError('fetch failed', 0),
    });

    await expect(readProviderUser(client)).resolves.toEqual({
      kind: 'unavailable',
      failure: { code: undefined, status: 0 },
    });
  });

  it('is signed out, with an empty failure, when there is neither a user nor an error', async () => {
    const { client } = clientWith({ data: { user: null }, error: null });

    await expect(readProviderUser(client)).resolves.toEqual({
      kind: 'signed-out',
      failure: { code: undefined, status: undefined },
    });
  });
});
