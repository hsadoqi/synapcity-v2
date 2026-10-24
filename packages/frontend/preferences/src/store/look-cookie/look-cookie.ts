import {
  LOOK_COOKIE_NAME,
  parseLook,
  type Look,
} from '@synapcity/domain-preferences';

/*
 * The shared look (ADR-0010, amendment): one cookie, so a person's look shows
 * on every host under one parent domain. The browser writes it, so it is not
 * HttpOnly; that is acceptable only because it holds display choices (see
 * `lookSchema`). Reading and writing never throw: a browser that blocks
 * cookies simply has no shared look.
 */

const ONE_YEAR_SECONDS = 31_536_000;

let configuredDomain: string | undefined;

/**
 * The parent domain the cookie is shared on, from the host's own setting.
 * Unset (or empty) writes a host-only cookie, which keeps local development
 * and preview builds working. Hosts call this once at startup.
 */
export function configureLookCookie(config: { domain?: string }): void {
  configuredDomain = config.domain ? config.domain : undefined;
}

export function serializeLookCookie(
  look: Look,
  options: { domain?: string; secure: boolean },
): string {
  const parts = [
    `${LOOK_COOKIE_NAME}=${encodeURIComponent(JSON.stringify(look))}`,
    'Path=/',
    'SameSite=Lax',
    `Max-Age=${ONE_YEAR_SECONDS}`,
  ];
  if (options.domain) parts.push(`Domain=${options.domain}`);
  if (options.secure) parts.push('Secure');
  return parts.join('; ');
}

/** The look in the cookie, or null when it is missing, invalid or newer. */
export function readLookCookie(): Look | null {
  try {
    const prefix = `${LOOK_COOKIE_NAME}=`;
    const entry = document.cookie
      .split('; ')
      .find((part) => part.startsWith(prefix));
    if (!entry) return null;
    return parseLook(
      JSON.parse(decodeURIComponent(entry.slice(prefix.length))),
    );
  } catch {
    return null;
  }
}

export function writeLookCookie(look: Look): void {
  try {
    document.cookie = serializeLookCookie(look, {
      domain: configuredDomain,
      secure: location.protocol === 'https:',
    });
  } catch {
    // Without cookies the look still applies on this host.
  }
}
