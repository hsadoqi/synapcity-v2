import { describe, expect, it, vi } from 'vitest';
import type {
  ProviderUser,
  SupabaseServerClient,
} from '@synapcity/server-supabase';

import { mirrorToSession } from '.';

const user: ProviderUser = { id: 'u1', user_metadata: { a: 1 } };

function clientWith(update: unknown, refresh: unknown) {
  const updateUser = vi.fn().mockResolvedValue(update);
  const refreshSession = vi.fn().mockResolvedValue(refresh);
  return {
    client: {
      auth: { updateUser, refreshSession },
    } as unknown as SupabaseServerClient,
    updateUser,
    refreshSession,
  };
}

describe('mirrorToSession', () => {
  it('sends the patched metadata, then refreshes the token', async () => {
    const { client, updateUser, refreshSession } = clientWith(
      { error: null },
      { error: null },
    );

    const result = await mirrorToSession(client, user, [
      (m) => ({ ...m, b: 2 }),
      (m) => ({ ...m, c: 3 }),
    ]);

    expect(result).toEqual({ ok: true });
    expect(updateUser).toHaveBeenCalledWith({ data: { a: 1, b: 2, c: 3 } });
    expect(refreshSession).toHaveBeenCalledTimes(1);
  });

  it('stops at updateUser and does not refresh when the update fails', async () => {
    const { client, refreshSession } = clientWith(
      { error: { code: 'bad', status: 500, message: 'secret' } },
      { error: null },
    );

    const result = await mirrorToSession(client, user, []);

    expect(result).toEqual({
      ok: false,
      step: 'updateUser',
      failure: { code: 'bad', status: 500 },
    });
    expect(JSON.stringify(result)).not.toContain('secret');
    expect(refreshSession).not.toHaveBeenCalled();
  });

  it('reports a failed refresh as its own step', async () => {
    const { client } = clientWith(
      { error: null },
      { error: { code: 'expired', status: 401 } },
    );

    await expect(mirrorToSession(client, user, [])).resolves.toEqual({
      ok: false,
      step: 'refreshSession',
      failure: { code: 'expired', status: 401 },
    });
  });
});
