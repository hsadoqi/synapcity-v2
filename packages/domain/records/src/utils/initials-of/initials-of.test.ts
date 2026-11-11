import { describe, expect, it } from 'vitest';

import { initialsOf } from './initials-of';

describe('initialsOf', () => {
  it.each([
    ['Research Lab', 'RL'],
    ['ada lovelace', 'AL'],
    ['Ada Byron Lovelace', 'AL'],
    ['  Product   Studio  ', 'PS'],
    ['Ada', 'AD'],
    ['A', 'A'],
    ['(Draft) plan', 'DP'],
    ['Q3 — roadmap', 'QR'],
    ['2026 Goals', '2G'],
    ['élan vital', 'ÉV'],
    ['Ångström', 'ÅN'],
  ])('%j → %j', (name, expected) => {
    expect(initialsOf(name)).toBe(expected);
  });

  it('takes the parts of a name', () => {
    expect(initialsOf(['Ada', 'Lovelace'])).toBe('AL');
    expect(initialsOf(['Ada Byron', 'Lovelace'])).toBe('AL');
    expect(initialsOf(['Ada', ''])).toBe('AD');
  });

  it('keeps a decomposed accent with its letter', () => {
    expect(initialsOf('e\u0301mile zola')).toBe('E\u0301Z');
  });

  it.each(['', '   ', '— !', []])('returns an empty string for %j', (name) => {
    expect(initialsOf(name)).toBe('');
  });
});
