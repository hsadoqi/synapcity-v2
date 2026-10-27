import { AuthApiError, AuthRetryableFetchError } from '@supabase/supabase-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { SupabaseServerClient } from '@synapcity/server-supabase';

import { getCallerIdentity, SAVE_FAILED } from './caller';

const getUser = vi.fn();
const supabase = { auth: { getUser } } as unknown as SupabaseServerClient;

beforeEach(() => {
  getUser.mockReset();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

describe('getCallerIdentity', () => {
  it('is the verified caller, with nothing logged', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });

    await expect(getCallerIdentity(supabase)).resolves.toEqual({
      identity: { userId: 'u1' },
    });
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('asks a signed-out caller to sign in again', async () => {
    getUser.mockResolvedValue({
      data: { user: null },
      error: new AuthApiError('no session', 403, 'session_not_found'),
    });

    await expect(getCallerIdentity(supabase)).resolves.toEqual({
      failure: 'Sign in again to update your profile.',
      signedOut: true,
    });
    expect(console.warn).toHaveBeenCalledWith('getCallerIdentity failed', {
      code: 'session_not_found',
      status: 403,
    });
  });

  it('tells the caller to try again during an outage, without signing them out', async () => {
    getUser.mockResolvedValue({
      data: { user: null },
      error: new AuthRetryableFetchError('fetch failed', 0),
    });

    await expect(getCallerIdentity(supabase)).resolves.toEqual({
      failure: SAVE_FAILED,
    });
    expect(console.warn).toHaveBeenCalledWith(
      'getCallerIdentity failed',
      expect.objectContaining({ status: 0 }),
    );
  });

  it('never logs the error message or the session', async () => {
    getUser.mockResolvedValue({
      data: { user: null },
      error: new AuthApiError('secret detail', 401, 'bad_jwt'),
    });

    await getCallerIdentity(supabase);

    const logged = JSON.stringify(vi.mocked(console.warn).mock.calls);
    expect(logged).not.toContain('secret detail');
  });
});
