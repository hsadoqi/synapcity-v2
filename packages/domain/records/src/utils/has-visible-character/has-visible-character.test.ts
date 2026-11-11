import { describe, expect, it } from 'vitest';

import { hasVisibleCharacter } from './has-visible-character';

const ZWSP = '\u200B';
const ZWJ_FAMILY = '\u{1F468}\u200D\u{1F469}\u200D\u{1F467}'; // emoji joined by zero-width joiners

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
