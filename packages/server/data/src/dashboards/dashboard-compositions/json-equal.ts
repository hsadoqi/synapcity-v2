/**
 * Structural equality of two JSON values, ignoring object key order (which
 * `jsonb` does not keep) and nothing else: array order, number values and
 * strings must match exactly. Used to tell that a stored document is what a
 * retried save submitted.
 */
export function jsonEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (
    typeof a !== 'object' ||
    typeof b !== 'object' ||
    a === null ||
    b === null
  ) {
    return false;
  }
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    return (
      a.length === b.length && a.every((value, i) => jsonEqual(value, b[i]))
    );
  }
  const left = a as Record<string, unknown>;
  const right = b as Record<string, unknown>;
  const keys = Object.keys(left);
  return (
    keys.length === Object.keys(right).length &&
    keys.every(
      (key) => Object.hasOwn(right, key) && jsonEqual(left[key], right[key]),
    )
  );
}
