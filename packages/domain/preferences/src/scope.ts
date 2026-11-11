import { z } from 'zod';

import { isPlainObject } from './is-plain-object';
import { appearanceSchema, type Settings } from './settings';

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
    // Taste, like the fonts: it follows the person.
    radius: 'account',
    // Depends on the screen and the pointer in use: it stays on the device.
    density: 'device',
    // Depends on the screen and the eyes in front of it: it stays on the device.
    textSize: 'device',
  },
  // Device by default; the person may apply them everywhere (appearanceOverride).
  appearance: {
    animationsEnabled: 'device',
    reducedMotion: 'device',
    contrastMode: 'device',
    colorScheme: 'device',
    showBorders: 'device',
  },
};

/** The display settings a person can apply on all their devices. */
export const displaySchema = appearanceSchema.omit({ colorScheme: true });
export type DisplaySettings = z.infer<typeof displaySchema>;

/** The display settings currently in effect. */
export function displayOf(settings: Settings): DisplaySettings {
  return displaySchema.parse(settings.appearance);
}

/** Whether a patch changes anything saved to the account. */
export function touchesAccount(patch: Record<string, unknown>): boolean {
  return Object.entries(patch).some(
    ([section, fields]) =>
      Object.hasOwn(settingScope, section) &&
      isPlainObject(fields) &&
      Object.keys(fields).some(
        (field) =>
          (settingScope[section as keyof Settings] as Record<string, string>)[
            field
          ] === 'account',
      ),
  );
}
