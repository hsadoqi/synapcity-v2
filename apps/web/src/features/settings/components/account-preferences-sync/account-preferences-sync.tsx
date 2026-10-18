'use client';

import { useEffect } from 'react';

import {
  readDeviceDisplay,
  reconcile,
  writeDeviceDisplay,
} from '../../lib/account-sync';
import type { AccountPreferences } from '../../lib/scope';
import { parseImport } from '../../lib/settings';
import {
  applyAppearance,
  PREFERENCES_SAVED_EVENT,
  PREFERENCES_STORAGE_KEY,
} from '../../shared/appearance-attributes';
import { applyFontPreferences } from '../../shared/font-preferences';
import { pageLanguage } from '../../types/regional';
import { settingsDefaults, type Settings } from '../../types/settings';

function readLocal(): Settings {
  try {
    const saved = localStorage.getItem(PREFERENCES_STORAGE_KEY);
    return saved ? parseImport(JSON.parse(saved)).settings : settingsDefaults;
  } catch {
    return settingsDefaults;
  }
}

/**
 * Applies the account's preferences on every page (ADR-0010), not only on the
 * settings page. The boot scripts paint this browser's cached copy before
 * first paint; on a device whose cache is behind the account, this brings it
 * up to date, applies it, and caches it so the next load paints it directly.
 * It also keeps <html lang> on the chosen language after client navigation.
 *
 * It runs the same reconcile as SettingsProvider, so the two agree on a page
 * that has both. Saving, and adopting choices made before signing in, stay
 * with the settings page.
 */
export function AccountPreferencesSync({
  preferences,
}: {
  /** null when signed out, or signed in with nothing saved to the account. */
  preferences: AccountPreferences | null;
}) {
  useEffect(() => {
    const root = document.documentElement;
    let settings = readLocal();
    if (preferences) {
      const reconciled = reconcile(settings, preferences, readDeviceDisplay());
      writeDeviceDisplay(reconciled.setAside);
      settings = reconciled.settings;
      try {
        localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(settings));
        // Collectors follow consent through this event (privacy is account
        // scope, so it may just have changed).
        window.dispatchEvent(new Event(PREFERENCES_SAVED_EVENT));
      } catch {
        // Still applied for this visit.
      }
      applyAppearance(root, settings.appearance);
      applyFontPreferences(root, settings.theme);
    }
    root.lang = pageLanguage(settings.regional.language);
  }, [preferences]);

  return null;
}
