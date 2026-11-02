import { describe, expect, it } from 'vitest';

import {
  hasNoBidiControls,
  hasVisibleCharacter,
  isPlainText,
  isSingleLineText,
} from './index';

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
