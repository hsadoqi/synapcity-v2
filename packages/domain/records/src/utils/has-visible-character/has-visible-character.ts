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
