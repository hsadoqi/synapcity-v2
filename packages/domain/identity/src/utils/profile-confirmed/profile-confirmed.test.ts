import { describe, expect, it } from 'vitest';

import {
  NEW_ACCOUNT_DAYS,
  PROFILE_CONFIRMED_KEY,
  isNewAccount,
  isProfileConfirmed,
  needsProfileSetup,
} from './profile-confirmed';

const NOW = Date.parse('2026-10-17T12:00:00Z');
const DAY = 24 * 60 * 60 * 1000;
const ago = (ms: number) => new Date(NOW - ms).toISOString();

describe('isProfileConfirmed', () => {
  it('is true only for an exact true', () => {
    expect(isProfileConfirmed({ [PROFILE_CONFIRMED_KEY]: true })).toBe(true);
  });

  it.each([
    null,
    undefined,
    {},
    { [PROFILE_CONFIRMED_KEY]: false },
    { [PROFILE_CONFIRMED_KEY]: 'true' },
    { [PROFILE_CONFIRMED_KEY]: 1 },
  ])('is false for %j', (metadata) => {
    expect(isProfileConfirmed(metadata)).toBe(false);
  });
});

describe('isNewAccount', () => {
  it('counts an account made moments ago, and one at the edge of the window', () => {
    expect(isNewAccount(ago(1000), NOW)).toBe(true);
    expect(isNewAccount(ago(NEW_ACCOUNT_DAYS * DAY), NOW)).toBe(true);
  });

  it('does not count an older account', () => {
    expect(isNewAccount(ago(NEW_ACCOUNT_DAYS * DAY + 1), NOW)).toBe(false);
    expect(isNewAccount(ago(400 * DAY), NOW)).toBe(false);
  });

  it.each([null, undefined, '', 'not a date'])(
    'is false when the date is %j, so doubt never adds a step',
    (value) => {
      expect(isNewAccount(value, NOW)).toBe(false);
    },
  );

  it('allows for the auth server clock running a little ahead of this one', () => {
    // A brand-new account must not look as if it comes from the future.
    expect(isNewAccount(new Date(NOW + 30 * 1000).toISOString(), NOW)).toBe(
      true,
    );
    expect(isNewAccount(new Date(NOW + 4 * 60 * 1000).toISOString(), NOW)).toBe(
      true,
    );
  });

  it('is false for a date too far in the future for clock skew to explain', () => {
    expect(isNewAccount(new Date(NOW + 6 * 60 * 1000).toISOString(), NOW)).toBe(
      false,
    );
    expect(isNewAccount(new Date(NOW + DAY).toISOString(), NOW)).toBe(false);
  });
});

describe('needsProfileSetup', () => {
  it('is true for a new account that was never asked', () => {
    expect(
      needsProfileSetup({ created_at: ago(DAY), user_metadata: {} }, NOW),
    ).toBe(true);
    expect(needsProfileSetup({ created_at: ago(DAY) }, NOW)).toBe(true);
  });

  it('is false once they finished or skipped it', () => {
    expect(
      needsProfileSetup(
        {
          created_at: ago(DAY),
          user_metadata: { [PROFILE_CONFIRMED_KEY]: true },
        },
        NOW,
      ),
    ).toBe(false);
  });

  it('is false for an account that existed long before this step', () => {
    expect(
      needsProfileSetup({ created_at: ago(90 * DAY), user_metadata: {} }, NOW),
    ).toBe(false);
  });

  it('is false when nothing is known about the user', () => {
    expect(needsProfileSetup({}, NOW)).toBe(false);
  });
});
