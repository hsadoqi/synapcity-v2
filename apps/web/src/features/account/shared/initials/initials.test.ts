import { describe, expect, it } from 'vitest';

import { initialsOf } from './initials';

describe('initialsOf', () => {
  it('takes up to two capitals from the first words', () => {
    expect(initialsOf('Ada Lovelace')).toBe('AL');
    expect(initialsOf('ada king lovelace')).toBe('AK');
    expect(initialsOf('  grace ')).toBe('G');
  });

  it('is empty without a name, so the avatar shows its default image', () => {
    expect(initialsOf(null)).toBe('');
    expect(initialsOf('')).toBe('');
  });
});
