import { describe, expect, it, vi } from 'vitest';

import {
  hasRecentLinkSignIn,
  hasRecentLinkSignInNow,
  LINK_SIGN_IN_WINDOW_MINUTES,
} from './recent-link-sign-in';

const NOW = 1_800_000_000;
const WINDOW = LINK_SIGN_IN_WINDOW_MINUTES * 60;

describe('hasRecentLinkSignIn', () => {
  it.each(['otp', 'magiclink'])('accepts a recent %s sign-in', (method) => {
    expect(hasRecentLinkSignIn([{ method, timestamp: NOW - 30 }], NOW)).toBe(
      true,
    );
  });

  it('accepts one at the edge of the window and refuses one just past it', () => {
    expect(
      hasRecentLinkSignIn([{ method: 'otp', timestamp: NOW - WINDOW }], NOW),
    ).toBe(true);
    expect(
      hasRecentLinkSignIn(
        [{ method: 'otp', timestamp: NOW - WINDOW - 1 }],
        NOW,
      ),
    ).toBe(false);
  });

  it('finds the link sign-in anywhere in the list, not only first', () => {
    expect(
      hasRecentLinkSignIn(
        [
          { method: 'token_refresh', timestamp: NOW - 5 },
          { method: 'otp', timestamp: NOW - 60 },
          { method: 'password', timestamp: NOW - 9999 },
        ],
        NOW,
      ),
    ).toBe(true);
  });

  it.each(['password', 'oauth', 'recovery', 'token_refresh', 'totp', 'email'])(
    'refuses a recent %s sign-in: only an emailed link counts',
    (method) => {
      expect(hasRecentLinkSignIn([{ method, timestamp: NOW - 5 }], NOW)).toBe(
        false,
      );
    },
  );

  it('refuses a timestamp from the future beyond a minute of clock skew', () => {
    expect(
      hasRecentLinkSignIn([{ method: 'otp', timestamp: NOW + 30 }], NOW),
    ).toBe(true);
    expect(
      hasRecentLinkSignIn([{ method: 'otp', timestamp: NOW + 3600 }], NOW),
    ).toBe(false);
  });

  it.each([
    ['nothing', undefined],
    ['null', null],
    ['a string', 'otp'],
    ['an object', { method: 'otp', timestamp: NOW }],
    ['bare method names, which carry no time', ['otp', 'magiclink']],
    ['a missing time', [{ method: 'otp' }]],
    ['a time that is text', [{ method: 'otp', timestamp: String(NOW) }]],
    ['a time that is not finite', [{ method: 'otp', timestamp: Infinity }]],
    ['an entry that is not an object', [null, 7]],
    ['an empty list', []],
  ])('refuses %s', (_label, amr) => {
    expect(hasRecentLinkSignIn(amr, NOW)).toBe(false);
  });
});

describe('hasRecentLinkSignInNow', () => {
  it('reads the clock', () => {
    vi.spyOn(Date, 'now').mockReturnValue(NOW * 1000);

    expect(
      hasRecentLinkSignInNow([{ method: 'otp', timestamp: NOW - 10 }]),
    ).toBe(true);
    expect(
      hasRecentLinkSignInNow([{ method: 'otp', timestamp: NOW - 5000 }]),
    ).toBe(false);
  });
});
