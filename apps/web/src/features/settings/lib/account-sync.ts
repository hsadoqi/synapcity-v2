import {
  displaySchema,
  type AccountPreferences,
  type DisplaySettings,
  type StoredAccountPreferences,
} from '@synapcity/domain-preferences';

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
