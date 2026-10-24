import { describe, expect, it } from 'vitest';
import { accountPart } from '../scope';
import { settingsDefaults, type Settings } from '../../schemas';
import { lookOf, lookWithAccount, parseLook } from './look';

const withPrivateValues = (): Settings => ({
  ...settingsDefaults,
  regional: { ...settingsDefaults.regional, language: 'fr' },
  notifications: { ...settingsDefaults.notifications, email: false },
  privacy: {
    ...settingsDefaults.privacy,
    errorReports: {
      granted: true,
      updatedAt: '2026-01-02T03:04:05.000Z',
      version: 1,
      askAgain: false,
    },
  },
  theme: { ...settingsDefaults.theme, density: 'compact', textSize: 120 },
});

describe('look', () => {
  it('keeps only the look fields from full settings', () => {
    const look = lookOf(withPrivateValues());
    expect(Object.keys(look).sort()).toEqual(['appearance', 'theme', 'v']);
    expect(Object.keys(look.theme).sort()).toEqual([
      'bodyFont',
      'codeFont',
      'density',
      'headingFont',
      'mode',
      'radius',
      'textSize',
    ]);
    expect(Object.keys(look.appearance).sort()).toEqual([
      'animationsEnabled',
      'contrastMode',
      'reducedMotion',
      'showBorders',
    ]);
    const text = JSON.stringify(look);
    expect(text).not.toContain('fr');
    expect(text).not.toContain('2026-01-02');
    expect(text).not.toContain('errorReports');
  });

  it('round-trips through parseLook', () => {
    const look = lookOf(withPrivateValues());
    expect(parseLook(JSON.parse(JSON.stringify(look)))).toEqual(look);
  });

  it('keeps device values while account-owned look fields take precedence', () => {
    const deviceLook = lookOf({
      ...settingsDefaults,
      theme: {
        ...settingsDefaults.theme,
        mode: 'dark',
        density: 'compact',
        textSize: 120,
        headingFont: 'fraunces',
      },
      appearance: {
        ...settingsDefaults.appearance,
        contrastMode: 'low',
      },
    });
    const account = accountPart({
      ...settingsDefaults,
      theme: {
        ...settingsDefaults.theme,
        headingFont: 'inter',
        radius: 'soft',
      },
    });

    const resolved = lookWithAccount(deviceLook, account);

    expect(resolved?.theme).toMatchObject({
      mode: 'dark',
      density: 'compact',
      textSize: 120,
      headingFont: 'inter',
      radius: 'soft',
    });
    expect(resolved?.appearance.contrastMode).toBe('low');
  });

  it('leaves a cookie-less visit to the browser storage fallback', () => {
    const account = accountPart({
      ...settingsDefaults,
      theme: { ...settingsDefaults.theme, headingFont: 'fraunces' },
    });

    expect(lookWithAccount(null, account)).toBeNull();
  });

  it('lets a global display override take precedence over the device look', () => {
    const deviceLook = lookOf({
      ...settingsDefaults,
      appearance: { ...settingsDefaults.appearance, contrastMode: 'low' },
    });
    const account = accountPart(settingsDefaults, {
      ...settingsDefaults.appearance,
      contrastMode: 'high',
    });

    expect(lookWithAccount(deviceLook, account)?.appearance.contrastMode).toBe(
      'high',
    );
  });

  it('ignores anything invalid or newer', () => {
    const good = lookOf(settingsDefaults);
    const bad: unknown[] = [
      { ...good, v: 2 },
      { ...good, theme: 'x' },
      { ...good, theme: { ...good.theme, headingFont: 'not-a-font' } },
      { ...good, theme: { ...good.theme, textSize: 9999 } },
      { ...good, appearance: { ...good.appearance, contrastMode: 'max' } },
      null,
      'dark',
      [],
      42,
    ];
    for (const value of bad) expect(parseLook(value)).toBeNull();
  });

  it('requires every field, so a cookie is never completed with defaults', () => {
    const good = lookOf(settingsDefaults);
    const dropped = (group: 'theme' | 'appearance', key: string) => {
      const copy = structuredClone(good) as Record<string, any>;
      delete copy[group][key];
      return copy;
    };
    for (const key of Object.keys(good.theme))
      expect(parseLook(dropped('theme', key)), key).toBeNull();
    for (const key of Object.keys(good.appearance))
      expect(parseLook(dropped('appearance', key)), key).toBeNull();
  });

  it('ignores keys it does not know', () => {
    const good = lookOf(settingsDefaults);
    expect(parseLook({ ...good, extra: 1 })).toEqual(good);
  });
});
