/**
 * Normalizes user input into an http(s) URL. Returns null for anything that
 * is not a web address, so links can never carry other schemes.
 */
// `host:port` (a colon before a digit) is an address, not a scheme.
const EXPLICIT_SCHEME = /^[a-z][a-z\d+.-]*:\/\//i;
const OTHER_SCHEME = /^[a-z][a-z\d+.-]*:(?!\d)/i;

export function normalizeLinkUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (!EXPLICIT_SCHEME.test(trimmed) && OTHER_SCHEME.test(trimmed)) return null;
  const candidate = EXPLICIT_SCHEME.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  try {
    const url = new URL(candidate);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    if (!url.hostname.includes('.') && url.hostname !== 'localhost')
      return null;
    return url.toString();
  } catch {
    return null;
  }
}
