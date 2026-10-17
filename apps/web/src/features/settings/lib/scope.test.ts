import { describe, expect, it } from 'vitest';

import {
  accountPart,
  fromTransferFile,
  isDefaultAccount,
  readAccountPreferences,
  settingScope,
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
      theme: { ...settingsDefaults.theme, mode: 'dark', bodyFont: 'lora' },
    });
    expect(account.theme).toEqual({
      headingFont: 'default',
      bodyFont: 'lora',
      codeFont: 'default',
    });
    expect(account).not.toHaveProperty('appearance');
    expect(account).not.toHaveProperty('appearanceOverride');
  });

  it.each([
    [{ regional: { language: 'fr' } }, true],
    [{ theme: { bodyFont: 'lora' } }, true],
    [{ privacy: { policyVersion: 1 } }, true],
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
    });
    expect(read).not.toHaveProperty('unknown');
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
