/*
 * Names and tags are one line. A newline, a tab or any other control character
 * in them is never intended, and an invisible one makes two different names
 * look identical. The bidirectional override and isolate controls are refused
 * too: they reorder what a reader sees ("Trojan source" style spoofing) without
 * changing what is stored.
 */

/** C0 and C1 control characters, including newline, tab and DEL. */
const CONTROL = /\p{Cc}/u;
/** U+202A to U+202E (embeddings, overrides) and U+2066 to U+2069 (isolates). */
const BIDI_CONTROL = /[\u202A-\u202E\u2066-\u2069]/;

/** True when `value` holds no bidirectional control character. */
export function hasNoBidiControls(value: string): boolean {
  return !BIDI_CONTROL.test(value);
}

/** True when `value` is one line: no control character (newline and tab included) and no bidi control. */
export function isSingleLineText(value: string): boolean {
  return !CONTROL.test(value) && hasNoBidiControls(value);
}
