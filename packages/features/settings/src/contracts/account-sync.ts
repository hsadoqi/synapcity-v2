import type {
  AccountPreferences,
  StoredAccountPreferences,
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
