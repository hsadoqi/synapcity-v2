import {
  lookFromCookieHeader,
  sanitizeCookieDomain,
  serializeLookCookie,
  type Look,
} from '@synapcity/domain-preferences';

/*
 * The shared look (ADR-0010, amendment): one cookie, so a person's look shows
 * on every host under one parent domain. The cookie's format, size cap and
 * validation live in `@synapcity/domain-preferences`, shared with the server.
 * The browser writes it, so it is not HttpOnly; that is acceptable only
 * because it holds display choices (see `lookSchema`). Reading and writing
 * never throw: a browser that blocks cookies simply has no shared look.
 */

let configuredDomain: string | undefined;

/**
 * The parent domain the cookie is shared on, from the host's own setting.
 * Unset, empty or anything but a plain host name writes a host-only cookie,
 * which keeps local development and preview builds working. Hosts call this
 * once at startup.
 */
export function configureLookCookie(config: { domain?: string }): void {
  configuredDomain = sanitizeCookieDomain(config.domain);
}

/** The look in the cookie, or null when it is missing, invalid or newer. */
export function readLookCookie(): Look | null {
  try {
    return lookFromCookieHeader(document.cookie);
  } catch {
    return null;
  }
}

export function writeLookCookie(look: Look): void {
  try {
    const secure = location.protocol === 'https:';
    document.cookie = serializeLookCookie(look, {
      domain: configuredDomain,
      secure,
    });
    // A browser silently refuses a domain it does not accept (a public suffix
    // such as vercel.app, or a host outside it). Without this check the look
    // would be lost; fall back to a cookie for this host alone.
    if (
      configuredDomain &&
      JSON.stringify(readLookCookie()) !== JSON.stringify(look)
    ) {
      document.cookie = serializeLookCookie(look, { secure });
    }
  } catch {
    // Without cookies the look still applies on this host.
  }
}
