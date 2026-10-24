/**
 * Whether a form value counts as "nothing entered". `0` and `false` are values;
 * an empty string, `null`, `undefined`, `NaN` and an empty array are not.
 */
export function isEmptyValue(value: unknown): boolean {
  if (value === undefined || value === null || value === '') return true;
  if (typeof value === 'number') return Number.isNaN(value);
  return Array.isArray(value) && value.length === 0;
}
