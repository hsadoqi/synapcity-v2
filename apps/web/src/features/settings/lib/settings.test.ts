import { describe, expect, it } from 'vitest';
import { mergeSettings, parseImport, parseImportPatch } from './settings';
import { settingsDefaults, settingsSchema } from '../types/settings';

describe('settings merge and import', () => {
  it('fills appearance fields missing from an older saved object', () => {
    expect(
      settingsSchema.parse({ appearance: { showBorders: true } }).appearance,
    ).toEqual({ ...settingsDefaults.appearance, showBorders: true });
  });

  it('rejects an unknown contrast mode or text size in an import', () => {
    expect(() =>
      parseImportPatch({
        appearance: { contrastMode: 'extreme', fontSize: 'huge' },
      }),
    ).toThrow(/Ignored: appearance.contrastMode, appearance.fontSize/);
  });

  it('returns only valid explicit changes in an import patch', () => {
    expect(
      parseImportPatch({
        regional: { language: 'fr', timezone: 'Invalid/Zone' },
        privacy: { tracking: false },
        account: { password: 'never-import-this' },
      }),
    ).toEqual({
      patch: { regional: { language: 'fr' }, privacy: { tracking: false } },
      ignored: ['regional.timezone', 'account'],
    });
  });

  it('converts legacy fields into a patch while preserving nested precedence', () => {
    expect(
      parseImportPatch({
        language: 'de',
        regional: { language: 'fr' },
        appearance: 'dark',
        showBorders: true,
      }),
    ).toEqual({
      patch: {
        regional: { language: 'fr' },
        theme: { mode: 'dark' },
        appearance: { showBorders: true },
      },
      ignored: ['language'],
    });
  });

  it('has complete defaults that pass validation', () => {
    expect(settingsSchema.parse(settingsDefaults)).toEqual(settingsDefaults);
    expect(
      settingsSchema.parse({ regional: { language: 'fr' } }).regional,
    ).toEqual({
      ...settingsDefaults.regional,
      language: 'fr',
    });
  });

  it('preserves sibling fields and other sections when updating one regional preference', () => {
    const current = mergeSettings(settingsDefaults, {
      regional: { timezone: 'Asia/Tokyo', timeFormat: '24-hour' },
      notifications: { email: false },
    });
    const next = mergeSettings(current, { regional: { language: 'fr' } });
    expect(next.regional).toEqual({ ...current.regional, language: 'fr' });
    expect(next.notifications).toEqual(current.notifications);
    expect(current.regional.language).toBe('en');
    expect(settingsDefaults.regional.timezone).toBe('system');
  });

  it('merges partial appearance, notification and privacy patches', () => {
    const next = mergeSettings(settingsDefaults, {
      appearance: { showBorders: true },
      notifications: { push: true },
      privacy: { tracking: true },
    });
    expect(next.appearance).toEqual({
      ...settingsDefaults.appearance,
      showBorders: true,
    });
    expect(next.notifications).toEqual({
      email: true,
      push: true,
      sound: true,
    });
    expect(next.privacy).toEqual({ dataSharing: false, tracking: true });
  });

  it('keeps the two existing mode fields aligned, with explicit theme mode taking precedence', () => {
    expect(
      mergeSettings(settingsDefaults, { appearance: { colorScheme: 'dark' } })
        .theme.mode,
    ).toBe('dark');
    const next = mergeSettings(settingsDefaults, {
      appearance: { colorScheme: 'dark' },
      theme: { mode: 'light' },
    });
    expect(next.theme.mode).toBe('light');
    expect(next.appearance.colorScheme).toBe('light');
  });

  it('rejects invalid timezone updates without mutating current settings', () => {
    expect(() =>
      mergeSettings(settingsDefaults, {
        regional: { timezone: 'Invalid/Zone' },
      }),
    ).toThrow();
    expect(settingsDefaults.regional.timezone).toBe('system');
  });

  it('imports valid leaves while reporting invalid and unknown leaves', () => {
    const current = mergeSettings(settingsDefaults, {
      regional: { timezone: 'Asia/Tokyo' },
    });
    const result = parseImport(
      {
        regional: { language: 'fr', timezone: 'Invalid/Zone', missing: true },
        notifications: { push: true, email: 'yes' },
      },
      current,
    );
    expect(result.settings.regional).toEqual({
      ...current.regional,
      language: 'fr',
    });
    expect(result.settings.notifications).toEqual({
      ...current.notifications,
      push: true,
    });
    expect(result.ignored).toEqual([
      'regional.timezone',
      'regional.missing',
      'notifications.email',
    ]);
  });

  it('restores the previous flat preferences format', () => {
    const result = parseImport({
      name: 'Old profile name',
      appearance: 'dark',
      language: 'de',
      timeFormat: '24-hour',
      dateFormat: 'YYYY-MM-DD',
      animationsEnabled: false,
      showBorders: true,
      notifications: { email: false },
      privacy: { tracking: true },
    });
    expect(result.settings.regional).toMatchObject({
      language: 'de',
      timeFormat: '24-hour',
      dateFormat: 'YYYY-MM-DD',
    });
    expect(result.settings.appearance).toMatchObject({
      animationsEnabled: false,
      showBorders: true,
      colorScheme: 'dark',
    });
    expect(result.settings.theme.mode).toBe('dark');
    expect(result.settings.notifications.email).toBe(false);
    expect(result.settings.privacy.tracking).toBe(true);
    expect(result.ignored).toContain('name');
  });

  it('prefers explicit nested regional values over legacy aliases regardless of order', () => {
    for (const input of [
      { language: 'de', regional: { language: 'fr' } },
      { regional: { language: 'fr' }, language: 'de' },
    ])
      expect(parseImport(input).settings.regional.language).toBe('fr');
  });

  it('prefers explicit nested theme mode over legacy appearance regardless of order', () => {
    for (const input of [
      { appearance: 'dark', theme: { mode: 'light' } },
      { theme: { mode: 'light' }, appearance: 'dark' },
    ]) {
      const result = parseImport(input);
      expect(result.settings.theme.mode).toBe('light');
      expect(result.settings.appearance.colorScheme).toBe('light');
      expect(result.ignored).toEqual(['appearance']);
    }
  });

  it('requires object sections but accepts their valid scalar fields', () => {
    const result = parseImport({
      regional: [],
      appearance: { showBorders: true, fontSize: 'large' },
      notifications: false,
      privacy: { tracking: false },
    });
    expect(result.settings.appearance).toMatchObject({
      showBorders: true,
      fontSize: 'large',
    });
    expect(result.settings.privacy.tracking).toBe(false);
    expect(result.ignored).toEqual(['regional', 'notifications']);
  });

  it('rejects object and array field values without discarding valid siblings', () => {
    const result = parseImport({
      regional: { language: {}, timezone: [], timeFormat: '24-hour' },
      notifications: { email: {}, push: true },
    });
    expect(result.settings.regional).toEqual({
      ...settingsDefaults.regional,
      timeFormat: '24-hour',
    });
    expect(result.settings.notifications).toEqual({
      ...settingsDefaults.notifications,
      push: true,
    });
    expect(result.ignored).toEqual([
      'regional.language',
      'regional.timezone',
      'notifications.email',
    ]);
  });

  it('excludes credentials and identity from imports and serialized preferences', () => {
    const result = parseImport({
      account: { password: 'secret', email: 'a@example.com' },
      name: 'Ada',
      regional: { language: 'fr' },
    });
    expect(result.ignored).toEqual(['account', 'name']);
    expect(JSON.stringify(result.settings)).not.toContain('secret');
    expect(Object.hasOwn(result.settings, 'account')).toBe(false);
    expect(
      settingsSchema.parse({
        ...settingsDefaults,
        account: { password: 'secret' },
      }),
    ).toEqual(settingsDefaults);
  });

  it.each([
    null,
    [],
    'fr',
    {},
    { regional: { timezone: 'Invalid/Zone' } },
    { account: { password: 'secret' } },
  ])(
    'rejects malformed input or files without valid preferences: %j',
    (input) => {
      expect(() => parseImport(input)).toThrow();
    },
  );

  it('round trips current preferences and resets all sections with a complete default patch', () => {
    const changed = mergeSettings(settingsDefaults, {
      regional: { language: 'fr' },
      notifications: { email: false },
      theme: { mode: 'dark' },
    });
    expect(parseImport(JSON.parse(JSON.stringify(changed))).settings).toEqual(
      changed,
    );
    expect(mergeSettings(changed, settingsDefaults)).toEqual(settingsDefaults);
  });
});
