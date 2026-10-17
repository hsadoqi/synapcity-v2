import { describe, expect, it } from 'vitest';

import { NOTICES, NOTICE_PARAM, isNoticeKey, withNotice } from './notices';

describe('isNoticeKey', () => {
  it('accepts every listed key', () => {
    for (const key of Object.keys(NOTICES)) expect(isNoticeKey(key)).toBe(true);
  });

  it.each([
    'unknown',
    '',
    null,
    undefined,
    // Inherited names on the object, not keys of the list.
    'constructor',
    'toString',
    '__proto__',
    'hasOwnProperty',
  ])('refuses %j', (value) => {
    expect(isNoticeKey(value)).toBe(false);
  });
});

describe('NOTICES', () => {
  it('gives every key plain, non-empty wording', () => {
    for (const message of Object.values(NOTICES)) {
      expect(message.length).toBeGreaterThan(0);
      expect(message).not.toMatch(/[<>]/);
    }
  });
});

describe('withNotice', () => {
  it('adds the notice to a path', () => {
    expect(withNotice('/abc/home', 'password-updated')).toBe(
      `/abc/home?${NOTICE_PARAM}=password-updated`,
    );
  });

  it('keeps an existing query and fragment', () => {
    expect(withNotice('/abc/home?tab=2#top', 'password-updated')).toBe(
      '/abc/home?tab=2&notice=password-updated#top',
    );
  });

  it('replaces a notice that is already there instead of doubling it', () => {
    expect(
      withNotice('/abc/home?notice=password-updated', 'password-updated'),
    ).toBe('/abc/home?notice=password-updated');
  });

  it('stays a same-origin path', () => {
    expect(withNotice('/abc/home', 'password-updated').startsWith('/')).toBe(
      true,
    );
    expect(withNotice('/abc/home', 'password-updated')).not.toMatch(/^\/\//);
  });
});
