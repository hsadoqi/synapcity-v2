/** The number of code points in `value` (what PostgreSQL's `char_length` counts). */
export function codePointLength(value: string): number {
  let count = 0;
  for (const _ of value) count += 1;
  return count;
}
