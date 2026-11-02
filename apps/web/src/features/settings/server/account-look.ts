import { cookies, headers } from 'next/headers';

import {
  LOOK_COOKIE_MAX_AGE,
  LOOK_COOKIE_NAME,
  lookWithoutAccount,
  parseLookCookieValue,
  sanitizeCookieDomain,
} from '@synapcity/domain-preferences';

/**
 * Takes the account-owned fields (fonts, radius) out of the shared look cookie
 * as the person signs out, so the page after sign-out is drawn without their
 * taste instead of switching away from it once the browser loads. Device
 * fields stay. Call it from a Server Action; it never throws, because leaving
 * must not fail on a display preference.
 *
 * An account display override is in the cookie too, but this device's own
 * values live only in its browser storage; the preferences runtime restores
 * those on the next load.
 */
export async function clearAccountLook(): Promise<void> {
  try {
    const store = await cookies();
    const look = parseLookCookieValue(store.get(LOOK_COOKIE_NAME)?.value);
    if (!look) return;
    const guest = lookWithoutAccount(look);
    if (JSON.stringify(guest) === JSON.stringify(look)) return;
    const forwarded = (await headers()).get('x-forwarded-proto');
    // The same attributes the browser and the proxy write, so this replaces
    // that cookie instead of adding a second one beside it.
    store.set(LOOK_COOKIE_NAME, JSON.stringify(guest), {
      path: '/',
      sameSite: 'lax',
      maxAge: LOOK_COOKIE_MAX_AGE,
      domain: sanitizeCookieDomain(
        process.env.NEXT_PUBLIC_PREFERENCES_COOKIE_DOMAIN,
      ),
      secure: forwarded?.split(',')[0]?.trim() === 'https',
      httpOnly: false,
    });
  } catch {
    // The browser's preferences runtime resets the look on the next load.
  }
}
