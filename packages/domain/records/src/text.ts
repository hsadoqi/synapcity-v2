/** The number of code points in `value` (what PostgreSQL's `char_length` counts). */
export function codePointLength(value: string): number {
  let count = 0;
  for (const _ of value) count += 1;
  return count;
}

/*
 * PostgreSQL rejects U+0000 in `text` and `jsonb`, and rejects unpaired UTF-16
 * surrogates when text is encoded for storage, so a string holding either would
 * fail the write with a database error. The application refuses such text at
 * its boundary instead: it never rewrites it, because changing what a person
 * typed is a different failure.
 */

/** A UTF-16 surrogate with no partner: what `String.prototype.isWellFormed` reports. */
const UNPAIRED_SURROGATE =
  /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/;

/** True when `value` can be stored: no U+0000 and no unpaired surrogate. */
export function isStorableText(value: string): boolean {
  return !value.includes('\u0000') && !UNPAIRED_SURROGATE.test(value);
}

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

/**
 * True when `value` has at least one character a reader can see: not
 * whitespace, not a control character, not an invisible format character (zero
 * width space, joiners and the like). `trim()` leaves a zero-width space in
 * place, so without this a name of only those would pass as "not blank" and
 * show as nothing. A joiner inside an emoji sequence is fine, because the emoji
 * around it are visible.
 */
const VISIBLE = /[^\s\p{Cc}\p{Cf}]/u;

export function hasVisibleCharacter(value: string): boolean {
  return VISIBLE.test(value);
}
