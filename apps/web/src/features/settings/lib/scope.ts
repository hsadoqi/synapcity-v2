import { z } from 'zod';

import { mergeSettings, parseImportPatch } from './settings';
import { appearanceSchema } from '../types/appearance';
import { dataPrivacyDefaults, dataPrivacySchema } from '../types/data-privacy';
import {
  notificationsDefaults,
  notificationsSchema,
} from '../types/notifications';
import { regionalDefaults, regionalSchema } from '../types/regional';
import { settingsDefaults, type Settings } from '../types/settings';
import { themeDefaults, themeSchema } from '../types/theme';

/**
 * Where each preference lives (ADR-0010). `account` follows the person and is
 * saved to Supabase; `device` stays in this browser. The type lists every
 * field, so a new setting does not compile until it is given a scope.
 */
export const settingScope: {
  [Section in keyof Settings]: Record<
    keyof Settings[Section],
    'account' | 'device'
  >;
} = {
  regional: {
    language: 'account',
    timeFormat: 'account',
    dateFormat: 'account',
    numberFormat: 'account',
    timezone: 'account',
    firstDayOfWeek: 'account',
  },
  notifications: { email: 'account', push: 'account', sound: 'account' },
  privacy: {
    analytics: 'account',
    errorReports: 'account',
    sharing: 'account',
  },
  theme: {
    mode: 'device',
    headingFont: 'account',
    bodyFont: 'account',
    codeFont: 'account',
  },
  // Device by default; the person may apply them everywhere (appearanceOverride).
  appearance: {
    animationsEnabled: 'device',
    reducedMotion: 'device',
    contrastMode: 'device',
    fontSize: 'device',
    colorScheme: 'device',
    showBorders: 'device',
  },
};

/** The display settings a person can apply on all their devices. */
export const displaySchema = appearanceSchema.omit({ colorScheme: true });
export type DisplaySettings = z.infer<typeof displaySchema>;

const accountThemeSchema = themeSchema.pick({
  headingFont: true,
  bodyFont: true,
  codeFont: true,
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
  }),
  appearanceOverride: displaySchema.optional(),
});
export type AccountPreferences = z.infer<typeof accountPreferencesSchema>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** The display settings currently in effect. */
export function displayOf(settings: Settings): DisplaySettings {
  return displaySchema.parse(settings.appearance);
}

/** The account part of `settings`, plus the display override when it is on. */
export function accountPart(
  settings: Settings,
  appearanceOverride: DisplaySettings | null = null,
): AccountPreferences {
  const { headingFont, bodyFont, codeFont } = settings.theme;
  return {
    regional: settings.regional,
    notifications: settings.notifications,
    privacy: settings.privacy,
    theme: { headingFont, bodyFont, codeFont },
    ...(appearanceOverride ? { appearanceOverride } : {}),
  };
}

/** The device part of `settings`, for export. */
function devicePart(settings: Settings) {
  return {
    theme: { mode: settings.theme.mode },
    appearance: settings.appearance,
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

/** Whether a patch changes anything saved to the account. */
export function touchesAccount(patch: Record<string, unknown>): boolean {
  return Object.entries(patch).some(
    ([section, fields]) =>
      Object.hasOwn(settingScope, section) &&
      isRecord(fields) &&
      Object.keys(fields).some(
        (field) =>
          (settingScope[section as keyof Settings] as Record<string, string>)[
            field
          ] === 'account',
      ),
  );
}

/**
 * Reads a stored account document. It goes through the same validation as
 * browser storage and imports, so an old or partly invalid row keeps every
 * field that is still valid and falls back to defaults for the rest.
 */
export function readAccountPreferences(raw: unknown): AccountPreferences {
  const document = isRecord(raw) ? raw : {};
  const { regional, notifications, privacy, theme } = document;
  let settings = settingsDefaults;
  try {
    const { patch } = parseImportPatch({
      ...(regional !== undefined && { regional }),
      ...(notifications !== undefined && { notifications }),
      ...(privacy !== undefined && { privacy }),
      ...(isRecord(theme) && {
        theme: {
          headingFont: theme.headingFont,
          bodyFont: theme.bodyFont,
          codeFont: theme.codeFont,
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

/** The export file format this build writes. Imports reject anything newer. */
export const TRANSFER_FILE_VERSION = 2;

/** The export file: what follows the person, and what stays on this device. */
export function toTransferFile(settings: Settings) {
  return {
    version: TRANSFER_FILE_VERSION,
    account: accountPart(settings),
    device: devicePart(settings),
  };
}

/**
 * Turns a version 2 export back into the flat shape the importer reads. Any
 * other input (the flat files exported before version 2) passes through.
 */
export function fromTransferFile(input: unknown): unknown {
  if (!isRecord(input) || input.version !== TRANSFER_FILE_VERSION) return input;
  const account = isRecord(input.account) ? input.account : {};
  const device = isRecord(input.device) ? input.device : {};
  const flat: Record<string, unknown> = {};
  for (const section of ['regional', 'notifications', 'privacy'] as const) {
    if (account[section] !== undefined) flat[section] = account[section];
  }
  if (isRecord(account.theme) || isRecord(device.theme)) {
    flat.theme = {
      ...(isRecord(account.theme) ? account.theme : {}),
      ...(isRecord(device.theme) ? device.theme : {}),
    };
  }
  if (device.appearance !== undefined) flat.appearance = device.appearance;
  return flat;
}
