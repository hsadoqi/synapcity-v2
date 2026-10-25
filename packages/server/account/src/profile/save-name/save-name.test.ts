import { describe, expect, it, vi } from 'vitest';
import type {
  ProviderUser,
  SupabaseServerClient,
} from '@synapcity/server-supabase';

import { saveName } from '.';

const user: ProviderUser = { id: 'u1', user_metadata: { avatar_url: 'a' } };

function clientWith(result: unknown) {
  const select = vi.fn().mockResolvedValue(result);
  const eq = vi.fn(() => ({ select }));
  const update = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ update }));
  return {
    client: { from } as unknown as SupabaseServerClient,
    from,
    update,
    eq,
    select,
  };
}

describe('saveName', () => {
  it("updates only the caller's own profile row", async () => {
    const { client, from, update, eq } = clientWith({
      data: [{ id: 'u1' }],
      error: null,
    });

    await saveName(client, user, 'Ada');

    expect(from).toHaveBeenCalledWith('profiles');
    expect(update).toHaveBeenCalledWith({ display_name: 'Ada' });
    expect(eq).toHaveBeenCalledWith('id', 'u1');
  });

  it('returns a patch that mirrors the name and keeps the other metadata', async () => {
    const { client } = clientWith({ data: [{ id: 'u1' }], error: null });

    const saved = await saveName(client, user, 'Ada');

    expect(saved.ok).toBe(true);
    if (!saved.ok) return;
    expect(saved.patch({ avatar_url: 'a', other: 1 })).toEqual({
      avatar_url: 'a',
      other: 1,
      full_name: 'Ada',
    });
  });

  it('fails with the database error code and status', async () => {
    const { client } = clientWith({
      data: null,
      error: { code: '42501', status: 403, message: 'secret' },
    });

    const saved = await saveName(client, user, 'Ada');

    expect(saved).toEqual({
      ok: false,
      failure: { code: '42501', status: 403 },
    });
    expect(JSON.stringify(saved)).not.toContain('secret');
  });

  it('does not look saved when no row matched', async () => {
    const { client } = clientWith({ data: [], error: null });

    await expect(saveName(client, user, 'Ada')).resolves.toEqual({
      ok: false,
      failure: { code: 'profile_row_missing' },
    });
  });
});
