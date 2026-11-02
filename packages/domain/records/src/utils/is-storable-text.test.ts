import { describe, expect, it } from 'vitest';

import { isStorableText } from './is-storable-text';

describe('isStorableText', () => {
  it.each([
    ['empty', ''],
    ['ASCII', 'Launch plan'],
    ['accented', 'café'],
    ['an astral character (a surrogate pair)', 'idea 💡'],
    ['two pairs in a row', '😀😀'],
    ['a newline and a tab', 'a\n\tb'],
  ])('accepts %s', (_name, value) => {
    expect(isStorableText(value)).toBe(true);
  });

  it.each([
    ['a NUL', 'a\u0000b'],
    ['only a NUL', '\u0000'],
    ['a high surrogate alone', 'a\uD83Db'],
    ['a high surrogate at the end', 'abc\uD83D'],
    ['a low surrogate alone', 'a\uDE00b'],
    ['a low surrogate at the start', '\uDE00abc'],
    ['a reversed pair', '\uDE00\uD83D'],
  ])('rejects %s', (_name, value) => {
    expect(isStorableText(value)).toBe(false);
  });

  it('agrees with String.prototype.isWellFormed on every surrogate arrangement', () => {
    const native = (s: string) =>
      (s as unknown as { isWellFormed(): boolean }).isWellFormed();
    const pieces = ['a', '\uD83D', '\uDE00', '😀', '\uDBFF', '\uDC00'];
    for (const x of pieces) {
      for (const y of pieces) {
        for (const z of pieces) {
          const value = `${x}${y}${z}`;
          expect(isStorableText(value), JSON.stringify(value)).toBe(
            native(value),
          );
        }
      }
    }
  });
});
