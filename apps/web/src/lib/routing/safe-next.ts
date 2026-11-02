import { PLACEHOLDER_ORIGIN } from './placeholder-origin';

/**
 * Last-resort destination when there is no valid `next` and no signed-in user to
 * build a home path from. Callers that know the user pass `homePathFor(id)` as
 * the fallback instead.
 */
export const DEFAULT_NEXT_PATH = '/';

/**
 * Returns a same-origin path that is safe to redirect to after sign-in.
 *
 * `next` arrives from a query string or form field, so it is untrusted. A value
 * such as `//evil.example`, `/\evil.example` or `/<tab>/evil.example` is read by
 * browsers as another origin. Resolving it against a placeholder origin and
 * requiring the origin to be unchanged rejects all of those.
 *
 * The origin check is not enough on its own: URL parsing collapses dot
 * segments, so `/.//evil.example` keeps the placeholder origin but resolves to
 * the path `//evil.example`. The result is therefore checked again.
 */
export function safeNextPath(
  raw: string | null | undefined,
  fallback: string = DEFAULT_NEXT_PATH,
): string {
  if (!raw || !raw.startsWith('/')) return fallback;

  try {
    const url = new URL(raw, PLACEHOLDER_ORIGIN);
    if (url.origin !== PLACEHOLDER_ORIGIN) return fallback;
    const path = `${url.pathname}${url.search}${url.hash}`;
    if (path.startsWith('//') || path.startsWith('/\\')) return fallback;
    return path;
  } catch {
    return fallback;
  }
}
