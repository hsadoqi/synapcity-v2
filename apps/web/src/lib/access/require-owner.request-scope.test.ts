import { describe, expect, it, vi } from 'vitest';

const getClaims = vi.hoisted(() => vi.fn());

/*
 * React `cache` memoizes per request only inside a server render; under
 * Vitest it does not memoize at all. This stand-in memoizes each wrapped
 * function for the life of the module, which here is one request.
 */
vi.mock('react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react')>()),
  cache: <A extends unknown[], R>(fn: (...args: A) => R) => {
    let called = false;
    let value: R;
    return (...args: A) => {
      if (!called) {
        value = fn(...args);
        called = true;
      }
      return value;
    };
  },
}));
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ auth: { getClaims } }),
}));

import {
  getCurrentUser,
  getVerifiedClaims,
  getVerifiedIdentity,
} from '../../features/auth/server/session';

import { requireOwner } from './require-owner';

describe('identity reads within one request', () => {
  it('verify the session claims once, however many readers there are', async () => {
    getClaims.mockResolvedValue({ data: { claims: { sub: 'u1' } } });

    // A layout and a page both guard the route, the header shows the user.
    await requireOwner('u1');
    await requireOwner('u1');
    await getCurrentUser();
    await getVerifiedIdentity();
    await getVerifiedClaims();

    expect(getClaims).toHaveBeenCalledOnce();
  });

  /*
   * What this proves: `requireSignedIn` and `requireOwner` take their claims
   * only from the shared `getVerifiedClaims` reader, so neither calls
   * `getClaims` on its own. What it does not prove: that React's real `cache`
   * scopes that reader to one server request. The stand-in above memoizes for
   * the life of the module, so it cannot show request boundaries, concurrent
   * requests staying separate, or the memo surviving a layout, a page and a
   * Server Component each running in their own render pass. That behaviour is
   * React's and is documented, not tested here; the pre-existing test above
   * relies on the same assumption.
   */
  it('has the protected layout, owner layout and page share one claims reader', async () => {
    // A fresh module scope, so the memoized read starts empty.
    vi.resetModules();
    getClaims.mockClear();
    getClaims.mockResolvedValue({ data: { claims: { sub: 'u1' } } });
    const owner = await import('./require-owner');
    const signedIn = await import('./require-signed-in');

    await signedIn.requireSignedIn();
    await owner.requireOwner('u1');
    await owner.requireOwner('u1');

    expect(getClaims).toHaveBeenCalledOnce();
  });
});
