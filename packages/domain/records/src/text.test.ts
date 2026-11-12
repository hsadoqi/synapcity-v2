import { describe, expect, it } from 'vitest';

import {
  hasNoBidiControls,
  hasVisibleCharacter,
  isPlainText,
  isSingleLineText,
  isStorableText,
} from './text';

const ZWSP = '\u200B';
const RLO = '\u202E'; // right-to-left override
const ZWJ_FAMILY = '\u{1F468}\u200D\u{1F469}\u200D\u{1F467}'; // emoji joined by zero-width joiners

describe('isSingleLineText', () => {
  it.each([
    'Launch plan',
    'café',
    'two  spaces',
    '日本語',
    ZWJ_FAMILY,
    'a-b_c',
  ])('accepts %j', (v) => {
    expect(isSingleLineText(v)).toBe(true);
  });

  it.each([
    ['a newline', 'a\nb'],
    ['a carriage return', 'a\rb'],
    ['a tab', 'a\tb'],
    ['a bell', 'a\u0007b'],
    ['DEL', 'a\u007Fb'],
    ['a C1 control', 'a\u0085b'],
    ['a right-to-left override', `a${RLO}b`],
    ['a bidi isolate', 'a\u2066b'],
  ])('rejects %s', (_name, v) => {
    expect(isSingleLineText(v)).toBe(false);
  });
});

describe('hasNoBidiControls', () => {
  it('flags exactly the embedding, override and isolate controls', () => {
    for (let code = 0x202a; code <= 0x202e; code += 1)
      expect(hasNoBidiControls(String.fromCharCode(code))).toBe(false);
    for (let code = 0x2066; code <= 0x2069; code += 1)
      expect(hasNoBidiControls(String.fromCharCode(code))).toBe(false);
    // The neighbours are not flagged: marks used in real Arabic and Hebrew text stay allowed.
    expect(hasNoBidiControls('\u200E\u200F\u2065\u206A')).toBe(true);
    expect(hasNoBidiControls('שלום עולם')).toBe(true);
  });
});

describe('isPlainText', () => {
  it.each([
    'one line',
    'two\nlines',
    'windows\r\nlines',
    'a\ttab',
    ZWJ_FAMILY,
    '',
  ])('accepts %j', (v) => {
    expect(isPlainText(v)).toBe(true);
  });

  it.each([
    ['a bell', 'a\u0007b'],
    ['a vertical tab', 'a\u000Bb'],
    ['a form feed', 'a\u000Cb'],
    ['an escape', 'a\u001Bb'],
    ['DEL', 'a\u007Fb'],
    ['a C1 control', 'a\u0085b'],
    ['a bidi override', `a${RLO}b`],
  ])('rejects %s', (_name, v) => {
    expect(isPlainText(v)).toBe(false);
  });
});

describe('hasVisibleCharacter', () => {
  it.each(['a', ' a ', '😀', ZWJ_FAMILY, '日', '.'])('accepts %j', (v) => {
    expect(hasVisibleCharacter(v)).toBe(true);
  });

  it.each([
    ['empty', ''],
    ['spaces', '   '],
    ['a no-break space', '\u00A0'],
    ['a zero-width space', ZWSP],
    ['several zero-width characters', `${ZWSP}\u200C\u200D\u2060\uFEFF`],
    ['a newline', '\n'],
    ['a control character', '\u0007'],
  ])('rejects %s', (_name, v) => {
    expect(hasVisibleCharacter(v)).toBe(false);
  });
});

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
