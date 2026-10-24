import { LOOK_COOKIE_NAME, parseLook, type Look } from './look';

/*
 * The shared look cookie, as plain strings, so the browser and the server
 * build and read exactly the same one (ADR-0010, amendment). Nothing here
 * touches `document`, `window` or a framework.
 */

export const LOOK_COOKIE_MAX_AGE = 31_536_000;

/** A real cookie is a few hundred characters; anything larger is refused unread. */
export const LOOK_COOKIE_MAX_LENGTH = 2000;

/**
 * The domain to share the cookie on, only when it is a plain host name. The
 * value goes into a cookie string, so anything with `;`, spaces or a scheme
 * could add attributes and is dropped, which leaves the cookie host-only.
 */
export function sanitizeCookieDomain(domain: string | undefined | null) {
  const value = domain?.trim().toLowerCase();
  return value && /^\.?[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(value)
    ? value
    : undefined;
}

export function serializeLookCookie(
  look: Look,
  options: { domain?: string; secure: boolean },
): string {
  const domain = sanitizeCookieDomain(options.domain);
  const parts = [
    `${LOOK_COOKIE_NAME}=${encodeURIComponent(JSON.stringify(look))}`,
    'Path=/',
    'SameSite=Lax',
    `Max-Age=${LOOK_COOKIE_MAX_AGE}`,
  ];
  if (domain) parts.push(`Domain=${domain}`);
  if (options.secure) parts.push('Secure');
  return parts.join('; ');
}

/** The look in one cookie value (still URL-encoded), or null. Never throws. */
export function parseLookCookieValue(
  raw: string | null | undefined,
): Look | null {
  if (!raw || raw.length > LOOK_COOKIE_MAX_LENGTH) return null;
  try {
    return parseLook(JSON.parse(decodeURIComponent(raw)));
  } catch {
    return null;
  }
}

/** The look in a `Cookie` request header (or `document.cookie`), or null. */
export function lookFromCookieHeader(
  header: string | null | undefined,
): Look | null {
  if (!header) return null;
  const prefix = `${LOOK_COOKIE_NAME}=`;
  const entry = header
    .split(';')
    .map((part) => part.trimStart())
    .find((part) => part.startsWith(prefix));
  return entry ? parseLookCookieValue(entry.slice(prefix.length)) : null;
}

/**
 * The `Set-Cookie` value that renews a valid cookie, or null when the request
 * has none. A cookie the server sets keeps its full lifetime in browsers that
 * shorten the ones scripts set (Safari), so hosts call this on each request.
 */
export function refreshedLookCookie(
  cookieHeader: string | null | undefined,
  options: { domain?: string; secure: boolean },
): string | null {
  const look = lookFromCookieHeader(cookieHeader);
  return look ? serializeLookCookie(look, options) : null;
}
