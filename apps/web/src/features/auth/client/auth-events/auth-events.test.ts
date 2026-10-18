import { describe, expect, it } from 'vitest';

import { shouldRefreshOnAuthEvent } from '.';

describe('shouldRefreshOnAuthEvent', () => {
  it('ignores the event fired on subscribe and token refreshes', () => {
    expect(shouldRefreshOnAuthEvent('INITIAL_SESSION', 'u1', 'u1')).toBe(false);
    expect(shouldRefreshOnAuthEvent('TOKEN_REFRESHED', 'u1', 'u1')).toBe(false);
  });

  it('refreshes when another tab signs the known user out', () => {
    expect(shouldRefreshOnAuthEvent('SIGNED_OUT', null, 'u1')).toBe(true);
  });

  it('does not refresh a signed-out page on SIGNED_OUT', () => {
    expect(shouldRefreshOnAuthEvent('SIGNED_OUT', null, null)).toBe(false);
  });

  it('refreshes when a different user signs in', () => {
    expect(shouldRefreshOnAuthEvent('SIGNED_IN', 'u2', 'u1')).toBe(true);
    expect(shouldRefreshOnAuthEvent('SIGNED_IN', 'u1', null)).toBe(true);
  });

  it('does not refresh on the focus-time SIGNED_IN for the same user', () => {
    expect(shouldRefreshOnAuthEvent('SIGNED_IN', 'u1', 'u1')).toBe(false);
  });

  it('refreshes when the user record changes elsewhere', () => {
    expect(shouldRefreshOnAuthEvent('USER_UPDATED', 'u1', 'u1')).toBe(true);
  });
});
