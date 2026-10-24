import {
  lookOf,
  parseImport,
  settingsDefaults,
  type Look,
  type Settings,
} from '@synapcity/domain-preferences';
import type { Mode } from '../../types';
import { readLookCookie, writeLookCookie } from '../look-cookie';
import { readStoredPreferences } from '../device-store';

/**
 * The look this browser currently has: the cookie, else the saved document,
 * else the defaults. Anything unreadable counts as absent.
 */
export function currentLook(): Look {
  const cookie = readLookCookie();
  if (cookie) return cookie;
  try {
    const saved = readStoredPreferences();
    if (saved) return lookOf(parseImport(JSON.parse(saved)).settings);
  } catch {
    // Fall through to the defaults.
  }
  return lookOf(settingsDefaults);
}

/** Records a mode chosen on this host in the shared look, keeping the rest. */
export function shareMode(mode: Mode): void {
  const look = currentLook();
  writeLookCookie({ ...look, theme: { ...look.theme, mode } });
}

/**
 * Writes the look of `settings` to the shared cookie. Call it right after
 * saving the document, from every place that changes a look field. It never
 * throws, so a blocked cookie cannot masquerade as unavailable storage.
 */
export function saveLook(settings: Settings): void {
  writeLookCookie(lookOf(settings));
}

/**
 * First load after the shared look arrived: with no cookie yet, copy the look
 * from the saved document once, so nobody loses their look. A cookie that is
 * already there, or a document that is absent or unreadable, changes nothing.
 */
export function migrateLookToCookie(): void {
  if (readLookCookie()) return;
  try {
    const saved = readStoredPreferences();
    if (!saved) return;
    saveLook(parseImport(JSON.parse(saved)).settings);
  } catch {
    // Nothing readable to carry over.
  }
}
