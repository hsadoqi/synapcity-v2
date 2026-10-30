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
