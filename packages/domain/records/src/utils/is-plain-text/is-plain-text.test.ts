import { describe, expect, it } from 'vitest';

import { isPlainText } from './is-plain-text';

const RLO = '\u202E'; // right-to-left override
const ZWJ_FAMILY = '\u{1F468}\u200D\u{1F469}\u200D\u{1F467}'; // emoji joined by zero-width joiners

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
