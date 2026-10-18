import { describe, expect, it } from 'vitest';

import {
  accountPart,
  fromTransferFile,
  isDefaultAccount,
  readAccountPreferences,
  settingScope,
  toTransferFile,
  touchesAccount,
  withAccount,
} from './scope';
import { settingsDefaults, settingsSchema } from '../types/settings';

function unwrapShape(section: keyof typeof settingsSchema.shape) {
  let schema: unknown = settingsSchema.shape[section];
  while (
    schema &&
    typeof schema === 'object' &&
    'unwrap' in schema &&
    typeof schema.unwrap === 'function'
  ) {
    schema = schema.unwrap();
  }
  return Object.keys((schema as { shape: object }).shape).sort();
}

describe('setting scope (ADR-0010)', () => {
  it('gives every settings section a scope map', () => {
    expect(Object.keys(settingScope).sort()).toEqual(
      Object.keys(settingsSchema.shape).sort(),
    );
  });

  it.each(Object.keys(settingScope) as (keyof typeof settingScope)[])(
    'gives every %s field exactly one scope',
    (section) => {
      expect(Object.keys(settingScope[section] ?? {}).sort()).toEqual(
        unwrapShape(section),
      );
    },
  );

  it('keeps colour mode and display settings on the device', () => {
    const account = accountPart({
      ...settingsDefaults,
      theme: {
        ...settingsDefaults.theme,
        mode: 'dark',
        bodyFont: 'lora',
        density: 'compact',
      },
    });
    // Corner radius follows the person with the fonts; density and mode stay on the device.
    expect(account.theme).toEqual({
      headingFont: 'default',
      bodyFont: 'lora',
      codeFont: 'default',
      radius: 'default',
    });
    expect(account).not.toHaveProperty('appearance');
    expect(account).not.toHaveProperty('appearanceOverride');
  });

  it('puts corner radius on the account and density on the device (ADR-0010)', () => {
    expect(settingScope.theme.radius).toBe('account');
    expect(settingScope.theme.density).toBe('device');
    expect(
      accountPart({
        ...settingsDefaults,
        theme: { ...settingsDefaults.theme, radius: 'round' },
      }).theme.radius,
    ).toBe('round');
  });

  it.each([
    [{ regional: { language: 'fr' } }, true],
    [{ theme: { bodyFont: 'lora' } }, true],
    [{ theme: { radius: 'round' } }, true],
    [{ theme: { density: 'compact' } }, false],
    [{ privacy: { sharing: { granted: false, updatedAt: null } } }, true],
    [{ notifications: { email: false } }, true],
    [{ notifications: { push: true } }, true],
    [{ notifications: { sound: false } }, true],
    [{ theme: { mode: 'dark' } }, false],
    [{ appearance: { fontSize: 'large' } }, false],
    [{ unknown: { language: 'fr' } }, false],
  ])('touchesAccount(%j) is %s', (patch, expected) => {
    expect(touchesAccount(patch)).toBe(expected);
  });

  it('treats only the defaults, with no override, as nothing to adopt', () => {
    expect(isDefaultAccount(accountPart(settingsDefaults))).toBe(true);
    expect(
      isDefaultAccount(
        accountPart({
          ...settingsDefaults,
          regional: { ...settingsDefaults.regional, language: 'de' },
        }),
      ),
    ).toBe(false);
    expect(
      isDefaultAccount(
        accountPart(settingsDefaults, {
          animationsEnabled: true,
          reducedMotion: false,
          contrastMode: 'none',
          fontSize: 'medium',
          showBorders: false,
        }),
      ),
    ).toBe(false);
  });
});

describe('readAccountPreferences', () => {
  it('keeps valid fields and replaces invalid ones with defaults', () => {
    const read = readAccountPreferences({
      regional: {
        language: 'ja',
        timezone: 'Invalid/Zone',
        firstDayOfWeek: 'Monday',
      },
      theme: { bodyFont: 'lora', mode: 'dark' },
      unknown: true,
    });
    expect(read.regional).toEqual({
      ...settingsDefaults.regional,
      language: 'ja',
      firstDayOfWeek: 'monday',
    });
    expect(read.theme).toEqual({
      headingFont: 'default',
      bodyFont: 'lora',
      codeFont: 'default',
      radius: 'default',
    });
    expect(read).not.toHaveProperty('unknown');
  });

  it('keeps a saved corner radius, drops an invalid one, and ignores a stored density', () => {
    // readAccountPreferences lists the theme fields by hand: a field missing from that list is
    // dropped on every reload without any error, which is what this guards.
    expect(
      readAccountPreferences({ theme: { radius: 'round' } }).theme.radius,
    ).toBe('round');
    expect(
      readAccountPreferences({ theme: { radius: 'pill' } }).theme.radius,
    ).toBe('default');
    expect(
      readAccountPreferences({ theme: { density: 'compact' } }).theme,
    ).not.toHaveProperty('density');
  });

  it('round-trips notifications and drops invalid values', () => {
    const notifications = { email: false, push: true, sound: false };
    expect(
      readAccountPreferences(
        accountPart({ ...settingsDefaults, notifications }),
      ).notifications,
    ).toEqual(notifications);
    expect(
      readAccountPreferences({ notifications: { push: 'yes', email: false } })
        .notifications,
    ).toEqual({ ...settingsDefaults.notifications, email: false });
  });

  it.each([null, 'text', [], {}])('reads %j as the defaults', (raw) => {
    expect(readAccountPreferences(raw)).toEqual(accountPart(settingsDefaults));
  });

  it('reads a valid display override and drops an invalid one', () => {
    const override = {
      animationsEnabled: false,
      reducedMotion: true,
      contrastMode: 'high',
      fontSize: 'large',
      showBorders: true,
    };
    expect(
      readAccountPreferences({ appearanceOverride: override })
        .appearanceOverride,
    ).toEqual(override);
    expect(
      readAccountPreferences({ appearanceOverride: { fontSize: 'huge' } }),
    ).not.toHaveProperty('appearanceOverride');
  });
});

describe('withAccount', () => {
  it('replaces the account part and keeps the device part', () => {
    const local = {
      ...settingsDefaults,
      regional: { ...settingsDefaults.regional, language: 'fr' as const },
      appearance: {
        ...settingsDefaults.appearance,
        fontSize: 'small' as const,
      },
    };
    const account = accountPart({
      ...settingsDefaults,
      regional: { ...settingsDefaults.regional, language: 'de' },
    });
    const merged = withAccount(local, account);
    expect(merged.regional.language).toBe('de');
    expect(merged.appearance.fontSize).toBe('small');
  });
});

describe('toTransferFile', () => {
  it('writes corner radius with the account and density with the device', () => {
    const file = toTransferFile({
      ...settingsDefaults,
      theme: { ...settingsDefaults.theme, radius: 'rounded', density: 'spacious' },
    });
    expect(file.account.theme.radius).toBe('rounded');
    expect(file.account.theme).not.toHaveProperty('density');
    expect(file.device.theme).toEqual({ mode: 'system', density: 'spacious' });
  });

  it('reads its own export back to the same theme', () => {
    const theme = {
      ...settingsDefaults.theme,
      radius: 'sharp' as const,
      density: 'compact' as const,
    };
    expect(fromTransferFile(toTransferFile({ ...settingsDefaults, theme }))).toMatchObject(
      { theme: { radius: 'sharp', density: 'compact' } },
    );
  });
});

describe('fromTransferFile', () => {
  it('passes the older flat export through unchanged', () => {
    const flat = { regional: { language: 'fr' } };
    expect(fromTransferFile(flat)).toBe(flat);
  });

  it('flattens a version 2 export, with device theme beside account fonts', () => {
    expect(
      fromTransferFile({
        version: 2,
        account: { regional: { language: 'fr' }, theme: { bodyFont: 'lora' } },
        device: { theme: { mode: 'dark' }, appearance: { fontSize: 'large' } },
      }),
    ).toEqual({
      regional: { language: 'fr' },
      theme: { bodyFont: 'lora', mode: 'dark' },
      appearance: { fontSize: 'large' },
    });
  });
});
