import { AuthApiError, AuthRetryableFetchError } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';

import { outcomeFromClaims, supabaseIdentityProvider } from './index';

function clientWith(auth: { getClaims?: unknown; getUser?: unknown }) {
  return {
    auth: {
      getClaims: vi.fn(auth.getClaims as () => unknown),
      getUser: vi.fn(auth.getUser as () => unknown),
    },
  } as unknown as Parameters<typeof supabaseIdentityProvider>[0];
}

describe('outcomeFromClaims', () => {
  it('reads verified claims as their subject', () => {
    expect(outcomeFromClaims({ sub: 'u1' })).toEqual({
      kind: 'user',
      userId: 'u1',
    });
  });

  it.each([null, undefined])('reads %s as no session', (claims) => {
    expect(outcomeFromClaims(claims)).toEqual({ kind: 'none' });
  });
});

describe('supabaseIdentityProvider claims()', () => {
  it('returns the subject of the verified claims', async () => {
    const provider = supabaseIdentityProvider(
      clientWith({
        getClaims: async () => ({
          data: { claims: { sub: 'u1' } },
          error: null,
        }),
      }),
    );

    await expect(provider.claims()).resolves.toEqual({
      kind: 'user',
      userId: 'u1',
    });
  });

  it('returns no session when there are no claims', async () => {
    const provider = supabaseIdentityProvider(
      clientWith({ getClaims: async () => ({ data: null, error: null }) }),
    );

    await expect(provider.claims()).resolves.toEqual({ kind: 'none' });
  });

  it('returns a refusal with the error code and status', async () => {
    const provider = supabaseIdentityProvider(
      clientWith({
        getClaims: async () => ({
          data: null,
          error: new AuthApiError('bad token', 401, 'bad_jwt'),
        }),
      }),
    );

    await expect(provider.claims()).resolves.toEqual({
      kind: 'refused',
      code: 'bad_jwt',
      status: 401,
    });
  });
});

describe('supabaseIdentityProvider user()', () => {
  it('returns the provider user’s id', async () => {
    const provider = supabaseIdentityProvider(
      clientWith({
        getUser: async () => ({ data: { user: { id: 'u1' } }, error: null }),
      }),
    );

    await expect(provider.user()).resolves.toEqual({
      kind: 'user',
      userId: 'u1',
    });
  });

  it('returns no session when there is no user and no error', async () => {
    const provider = supabaseIdentityProvider(
      clientWith({
        getUser: async () => ({ data: { user: null }, error: null }),
      }),
    );

    await expect(provider.user()).resolves.toEqual({ kind: 'none' });
  });

  it('reads a retryable fetch error as unreachable', async () => {
    const provider = supabaseIdentityProvider(
      clientWith({
        getUser: async () => ({
          data: { user: null },
          error: new AuthRetryableFetchError('fetch failed', 0),
        }),
      }),
    );

    const outcome = await provider.user();

    expect(outcome).toMatchObject({ kind: 'unreachable', status: 0 });
  });

  it('reads any other error as a refusal with its code and status', async () => {
    const provider = supabaseIdentityProvider(
      clientWith({
        getUser: async () => ({
          data: { user: null },
          error: new AuthApiError('gone', 403, 'user_not_found'),
        }),
      }),
    );

    await expect(provider.user()).resolves.toEqual({
      kind: 'refused',
      code: 'user_not_found',
      status: 403,
    });
  });

  it('treats an error that arrives with a user as a refusal, not a user', async () => {
    const provider = supabaseIdentityProvider(
      clientWith({
        getUser: async () => ({
          data: { user: { id: 'u1' } },
          error: new AuthApiError('odd', 500, 'unexpected_failure'),
        }),
      }),
    );

    await expect(provider.user()).resolves.toEqual({
      kind: 'refused',
      code: 'unexpected_failure',
      status: 500,
    });
  });
});
