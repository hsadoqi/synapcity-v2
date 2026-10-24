/**
 * Normalizes user input into an http(s) URL. Returns null for anything that
 * is not a web address, so links can never carry other schemes.
 */
export function normalizeLinkUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const candidate = /^[a-z][a-z\d+.-]*:/i.test(trimmed)
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
