import { z } from 'zod';

import { isPlainObject } from './is-plain-object';
import { mergeSettings, parseImportPatch } from './merge-settings';
import { displayOf, displaySchema, type DisplaySettings } from './scope';
import {
  dataPrivacyDefaults,
  dataPrivacySchema,
  notificationsDefaults,
  notificationsSchema,
  regionalDefaults,
  regionalSchema,
  settingsDefaults,
  themeDefaults,
  themeSchema,
  type Settings,
} from './settings';

const accountThemeSchema = themeSchema.pick({
  headingFont: true,
  bodyFont: true,
  codeFont: true,
  radius: true,
});

/** The document stored in `user_preferences.preferences`. */
export const accountPreferencesSchema = z.object({
  regional: regionalSchema.clone().default(regionalDefaults),
  notifications: notificationsSchema.clone().default(notificationsDefaults),
  privacy: dataPrivacySchema.clone().default(dataPrivacyDefaults),
  theme: accountThemeSchema.default({
    headingFont: themeDefaults.headingFont,
    bodyFont: themeDefaults.bodyFont,
    codeFont: themeDefaults.codeFont,
    radius: themeDefaults.radius,
  }),
  appearanceOverride: displaySchema.optional(),
});
export type AccountPreferences = z.infer<typeof accountPreferencesSchema>;

/** The account part of `settings`, plus the display override when it is on. */
export function accountPart(
  settings: Settings,
  appearanceOverride: DisplaySettings | null = null,
): AccountPreferences {
  const { headingFont, bodyFont, codeFont, radius } = settings.theme;
  return {
    regional: settings.regional,
    notifications: settings.notifications,
    privacy: settings.privacy,
    theme: { headingFont, bodyFont, codeFont, radius },
    ...(appearanceOverride ? { appearanceOverride } : {}),
  };
}

/** Whether nothing in the account part differs from the defaults. */
export function isDefaultAccount(preferences: AccountPreferences): boolean {
  const { appearanceOverride, ...rest } = preferences;
  return (
    !appearanceOverride &&
    JSON.stringify(rest) === JSON.stringify(accountPart(settingsDefaults))
  );
}

/**
 * Reads a stored account document. It goes through the same validation as
 * browser storage and imports, so an old or partly invalid row keeps every
 * field that is still valid and falls back to defaults for the rest.
 */
export function readAccountPreferences(raw: unknown): AccountPreferences {
  const document = isPlainObject(raw) ? raw : {};
  const { regional, notifications, privacy, theme } = document;
  let settings = settingsDefaults;
  try {
    const { patch } = parseImportPatch({
      ...(regional !== undefined && { regional }),
      ...(notifications !== undefined && { notifications }),
      ...(privacy !== undefined && { privacy }),
      ...(isPlainObject(theme) && {
        theme: {
          headingFont: theme.headingFont,
          bodyFont: theme.bodyFont,
          codeFont: theme.codeFont,
          // Density is device scope, so a stored account document is not read for it.
          radius: theme.radius,
        },
      }),
    });
    settings = mergeSettings(settingsDefaults, patch);
  } catch {
    // Nothing valid stored: the defaults stand.
  }
  const override = displaySchema.safeParse(document.appearanceOverride);
  return accountPart(settings, override.success ? override.data : null);
}

/** `settings` with the account part replaced by `account`. */
export function withAccount(
  settings: Settings,
  account: AccountPreferences,
): Settings {
  return mergeSettings(settings, {
    regional: account.regional,
    notifications: account.notifications,
    privacy: account.privacy,
    theme: account.theme,
    ...(account.appearanceOverride && {
      appearance: account.appearanceOverride,
    }),
  });
}

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
