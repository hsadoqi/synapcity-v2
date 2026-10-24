import {
  lookOf,
  parseImport,
  settingsDefaults,
  type Look,
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
