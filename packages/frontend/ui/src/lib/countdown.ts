/** One clock part as two digits: 7 → "07". Fractions floor and negatives read 0. */
export function padTime(n: number): string {
  return String(Math.max(0, Math.floor(n))).padStart(2, '0');
}

/** The seconds in an `hh:mm:ss` string. Missing or non-numeric parts count as 0. */
export function parseDuration(value: string): number {
  const [h = 0, m = 0, s = 0] = String(value)
    .split(':')
    .map((part) => Number(part) || 0);
  return Math.max(0, h * 3600 + m * 60 + s);
}
