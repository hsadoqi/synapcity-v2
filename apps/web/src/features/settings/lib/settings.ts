import { z } from 'zod';
import {
  settingsDefaults,
  settingsSchema,
  type Settings,
  type SettingsPatch,
} from '../types/settings';
import {
  transferSchema,
  type TransferSettingsPatch,
} from '../types/import-export';
import { withCurrentPolicy } from '../types/data-privacy';
import { legacyFontSizes } from '../types/theme';

export function mergeSettings(value: Settings, patch: SettingsPatch): Settings {
  const mode =
    patch.theme?.mode ?? patch.appearance?.colorScheme ?? value.theme.mode;
  const next = settingsSchema.parse({
    regional: { ...value.regional, ...patch.regional },
    appearance: { ...value.appearance, ...patch.appearance, colorScheme: mode },
    notifications: { ...value.notifications, ...patch.notifications },
    privacy: { ...value.privacy, ...patch.privacy },
    theme: { ...value.theme, ...patch.theme, mode },
  });
  // Saved, imported or merged, a grant counts only under the current wording.
  return { ...next, privacy: withCurrentPolicy(next.privacy) };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Earlier versions saved an `account` entry (name, email and a password) next
 * to the preferences. Preferences never hold account data, and a typed
 * password must not stay in the browser. Returns what to store instead: the
 * JSON without `account`, `null` when nothing else was stored (remove the
 * item), or `undefined` when there is nothing to remove.
 */
export function withoutStoredAccount(saved: string): string | null | undefined {
  let parsed: unknown;
  try {
    parsed = JSON.parse(saved);
  } catch {
    return undefined;
  }
  if (!isRecord(parsed) || !Object.hasOwn(parsed, 'account')) return undefined;
  const rest = { ...parsed };
  delete rest.account;
  return Object.keys(rest).length > 0 ? JSON.stringify(rest) : null;
}

const legacyFields = {
  language: ['regional', 'language'],
  timeFormat: ['regional', 'timeFormat'],
  dateFormat: ['regional', 'dateFormat'],
  showBorders: ['appearance', 'showBorders'],
  animationsEnabled: ['appearance', 'animationsEnabled'],
} as const;

// Earlier versions named the two privacy choices by what they switched on.
const legacyPrivacyFields = {
  dataSharing: 'sharing',
  tracking: 'analytics',
} as const;

// Import and storage restoration share validation, including the old flat shape.
// Account credentials and profile identity are never accepted as preferences.
export function parseImportPatch(input: unknown) {
  if (!isRecord(input))
    throw new Error('Choose a JSON object containing preferences.');
  const patch: Record<string, Record<string, unknown>> = {};
  const ignored: string[] = [];
  let accepted = 0;

  function accept(
    section: keyof TransferSettingsPatch,
    field: string,
    value: unknown,
    path: string,
  ) {
    let schema: unknown = transferSchema.shape[section];
    while (schema instanceof z.ZodDefault || schema instanceof z.ZodOptional) {
      schema = schema.unwrap();
    }
    if (!(schema instanceof z.ZodObject)) {
      ignored.push(path);
      return;
    }
    const shape: Record<string, z.ZodType> = schema.shape;
    const result = Object.hasOwn(shape, field)
      ? shape[field]!.safeParse(value)
      : undefined;
    if (result?.success) {
      patch[section] ??= {};
      patch[section][field] = result.data;
      accepted++;
    } else {
      ignored.push(path);
    }
  }

  for (const [key, value] of Object.entries(input)) {
    if (key === 'account') {
      ignored.push(key);
    } else if (key === 'appearance' && typeof value === 'string') {
      if (isRecord(input.theme) && Object.hasOwn(input.theme, 'mode')) {
        ignored.push(key);
      } else {
        accept('theme', 'mode', value, key);
      }
    } else if (Object.hasOwn(legacyFields, key)) {
      const [section, field] = legacyFields[key as keyof typeof legacyFields];
      // An explicit nested preference takes precedence over its legacy alias.
      if (!isRecord(input[section]) || !Object.hasOwn(input[section], field)) {
        accept(section, field, value, key);
      } else {
        ignored.push(key);
      }
    } else if (Object.hasOwn(transferSchema.shape, key) && isRecord(value)) {
      for (const [field, item] of Object.entries(value)) {
        if (key === 'appearance' && field === 'fontSize') {
          // As above, the current setting takes precedence over the old one.
          if (isRecord(input.theme) && Object.hasOwn(input.theme, 'textSize')) {
            ignored.push(`${key}.${field}`);
            continue;
          }
          const size =
            typeof item === 'string' && Object.hasOwn(legacyFontSizes, item)
              ? legacyFontSizes[item as keyof typeof legacyFontSizes]
              : undefined;
          accept('theme', 'textSize', size, `${key}.${field}`);
        } else if (
          key === 'privacy' &&
          Object.hasOwn(legacyPrivacyFields, field)
        ) {
          const renamed =
            legacyPrivacyFields[field as keyof typeof legacyPrivacyFields];
          // As above, the current name takes precedence over the old one.
          if (Object.hasOwn(value, renamed)) {
            ignored.push(`${key}.${field}`);
            continue;
          }
          // Their bare boolean reads as a choice under the first wording.
          accept('privacy', renamed, item, `${key}.${field}`);
        } else {
          accept(
            key as keyof TransferSettingsPatch,
            field,
            item,
            `${key}.${field}`,
          );
        }
      }
    } else {
      ignored.push(key);
    }
  }

  if (!accepted) {
    throw new Error(
      `No valid preferences found.${ignored.length ? ` Ignored: ${ignored.join(', ')}.` : ''}`,
    );
  }
  // Keep absent fields absent: the provider merges into its latest state.
  return { patch: patch as TransferSettingsPatch, ignored };
}

export function parseImport(
  input: unknown,
  current: Settings = settingsDefaults,
) {
  const { patch, ignored } = parseImportPatch(input);
  return { settings: mergeSettings(current, patch), ignored };
}
