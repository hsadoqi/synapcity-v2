import { describe, expect, it } from 'vitest';

import { withoutStoredAccount } from './merge-settings';

describe('withoutStoredAccount', () => {
  it('drops the account entry and keeps every preference as stored', () => {
    const saved = JSON.stringify({
      regional: { language: 'fr' },
      account: { name: 'Ada', email: 'a@b.co', password: 'secret-password' },
      language: 'de',
    });

    const cleaned = withoutStoredAccount(saved);

    expect(JSON.parse(cleaned!)).toEqual({
      regional: { language: 'fr' },
      language: 'de',
    });
    expect(cleaned).not.toContain('secret-password');
  });

  it('says to remove the item when only the account was stored', () => {
    expect(
      withoutStoredAccount(JSON.stringify({ account: { password: 'x' } })),
    ).toBeNull();
  });

  it('leaves alone anything with no account entry or that is not an object', () => {
    expect(
      withoutStoredAccount('{"regional":{"language":"fr"}}'),
    ).toBeUndefined();
    expect(withoutStoredAccount('not json')).toBeUndefined();
    expect(withoutStoredAccount('[1,2]')).toBeUndefined();
    expect(withoutStoredAccount('"account"')).toBeUndefined();
  });
});
