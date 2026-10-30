import { hasNoBidiControls } from './is-single-line-text';

/**
 * True for a control character a description may not hold: all of C0 and C1
 * (U+0000 to U+001F, U+007F to U+009F) except tab, newline and carriage return.
 */
function isDisallowedControl(code: number): boolean {
  if (code === 0x09 || code === 0x0a || code === 0x0d) return false;
  return code <= 0x1f || (code >= 0x7f && code <= 0x9f);
}

/**
 * True when `value` is text a person wrote: newlines (`\n`, `\r`) and tabs are
 * fine, as in a description; other control characters and bidi controls are not.
 */
export function isPlainText(value: string): boolean {
  for (const character of value) {
    if (isDisallowedControl(character.codePointAt(0) ?? 0)) return false;
  }
  return hasNoBidiControls(value);
}
