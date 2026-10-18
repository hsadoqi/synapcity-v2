import { mergeSettings } from './settings';
import {
  displayOf,
  displaySchema,
  withAccount,
  type AccountPreferences,
  type DisplaySettings,
} from './scope';
import type { Settings } from '../types/settings';

/** What the settings page loads from `user_preferences` (ADR-0010). */
export type StoredAccountPreferences = {
  /** null: signed in, but nothing saved to the account yet. */
  preferences: AccountPreferences | null;
  deviceTimezone: string | null;
};

export type SavePreferencesResult =
  { ok: true } | { ok: false; error: string; signedOut?: true };

/** Given to SettingsProvider when someone is signed in. */
export type AccountSync = {
  stored: StoredAccountPreferences;
  save: (
    preferences: AccountPreferences,
    deviceTimezone: string,
  ) => Promise<SavePreferencesResult>;
};

/**
 * This device's own display settings, set aside while the account's display
 * override is in effect, so turning the override off restores them.
 */
const DEVICE_DISPLAY_KEY = 'synapcity-device-display';

export function readDeviceDisplay(): DisplaySettings | null {
  try {
    const saved = localStorage.getItem(DEVICE_DISPLAY_KEY);
    if (!saved) return null;
    const parsed = displaySchema.safeParse(JSON.parse(saved));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function writeDeviceDisplay(value: DisplaySettings | null): void {
  try {
    if (value) localStorage.setItem(DEVICE_DISPLAY_KEY, JSON.stringify(value));
    else localStorage.removeItem(DEVICE_DISPLAY_KEY);
  } catch {
    // Without storage the override still applies for this visit.
  }
}

export function deviceTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Applies the account's preferences over what this browser saved. The account
 * wins for its own part (ADR-0010). With a display override, this device's own
 * display settings are set aside first; without one, any set aside earlier
 * come back.
 */
export function reconcile(
  local: Settings,
  account: AccountPreferences,
  setAside: DisplaySettings | null,
): { settings: Settings; setAside: DisplaySettings | null } {
  const settings = withAccount(local, account);
  if (account.appearanceOverride) {
    return { settings, setAside: setAside ?? displayOf(local) };
  }
  return {
    settings: setAside
      ? mergeSettings(settings, { appearance: setAside })
      : settings,
    setAside: null,
  };
}
