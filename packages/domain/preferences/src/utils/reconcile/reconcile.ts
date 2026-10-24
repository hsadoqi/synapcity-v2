import type { Settings } from '../../schemas';
import { mergeSettings } from '../merge-settings';
import {
  displayOf,
  withAccount,
  type AccountPreferences,
  type DisplaySettings,
} from '../scope';

/** What the settings page loads from `user_preferences` (ADR-0010). */
export type StoredAccountPreferences = {
  /** null: signed in, but nothing saved to the account yet. */
  preferences: AccountPreferences | null;
  deviceTimezone: string | null;
};

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
