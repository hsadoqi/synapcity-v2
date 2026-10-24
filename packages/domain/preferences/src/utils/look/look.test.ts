import { describe, expect, it } from 'vitest';
import { settingsDefaults, type Settings } from '../../schemas';
import { lookOf, parseLook } from './look';

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
});
