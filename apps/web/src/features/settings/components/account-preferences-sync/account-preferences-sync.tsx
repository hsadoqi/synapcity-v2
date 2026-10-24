'use client';

import { useEffect } from 'react';

import { reconcile } from '@synapcity/domain-preferences';
import type { AccountPreferences } from '@synapcity/domain-preferences';
import { parseImport } from '@synapcity/domain-preferences';
import {
  applyAppearance,
  announcePreferencesSaved,
  readDeviceDisplay,
  readStoredPreferences,
  writeDeviceDisplay,
  writeStoredPreferences,
} from '@synapcity/frontend-preferences';
import { applyFontPreferences } from '@synapcity/frontend-preferences';
import { pageLanguage } from '@synapcity/domain-preferences';
import { settingsDefaults, type Settings } from '@synapcity/domain-preferences';

function readLocal(): Settings {
  try {
    const saved = readStoredPreferences();
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
        writeStoredPreferences(JSON.stringify(settings));
        // Collectors follow consent through this event (privacy is account
        // scope, so it may just have changed).
        announcePreferencesSaved();
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
