import { beforeEach, describe, expect, it } from 'vitest';
import {
  LOOK_COOKIE_NAME,
  lookOf,
  settingsDefaults,
  type Settings,
} from '@synapcity/domain-preferences';
import { readLookCookie } from '../look-cookie';
import { writeStoredPreferences } from '../device-store';
import {
  currentLook,
  migrateLookToCookie,
  saveLook,
  shareMode,
} from './shared-look';

const customised: Settings = {
  ...settingsDefaults,
  regional: { ...settingsDefaults.regional, language: 'fr' },
  theme: { ...settingsDefaults.theme, mode: 'dark', density: 'compact' },
};
const clearCookie = () => {
  document.cookie = `${LOOK_COOKIE_NAME}=; Path=/; Max-Age=0`;
};
beforeEach(() => {
  localStorage.clear();
  clearCookie();
});

describe('shared look', () => {
  it('saveLook writes only the look', () => {
    saveLook(customised);
    const cookie = decodeURIComponent(document.cookie);
    expect(readLookCookie()).toEqual(lookOf(customised));
    expect(cookie).not.toContain('"fr"');
    expect(cookie).not.toContain('regional');
  });

  it('migrates the stored document once and only when there is no cookie', () => {
    writeStoredPreferences(JSON.stringify(customised));
    migrateLookToCookie();
    expect(readLookCookie()).toEqual(lookOf(customised));
    // A later edit to the document does not overwrite the cookie.
    writeStoredPreferences(
      JSON.stringify({
        ...customised,
        theme: { ...customised.theme, density: 'spacious' },
      }),
    );
    migrateLookToCookie();
    expect(readLookCookie()?.theme.density).toBe('compact');
  });

  it('leaves an existing cookie alone', () => {
    saveLook(settingsDefaults);
    writeStoredPreferences(JSON.stringify(customised));
    migrateLookToCookie();
    expect(readLookCookie()?.theme.density).toBe('comfortable');
  });

  it('does nothing when the stored document is unreadable or absent', () => {
    migrateLookToCookie();
    expect(readLookCookie()).toBeNull();
    writeStoredPreferences('{not json');
    expect(() => migrateLookToCookie()).not.toThrow();
    expect(readLookCookie()).toBeNull();
  });

  it('builds the current look from the cookie, then the document, then defaults', () => {
    expect(currentLook()).toEqual(lookOf(settingsDefaults));
    writeStoredPreferences(JSON.stringify(customised));
    expect(currentLook().theme.density).toBe('compact');
    saveLook(settingsDefaults);
    expect(currentLook().theme.density).toBe('comfortable');
    shareMode('light');
    expect(readLookCookie()?.theme.mode).toBe('light');
  });
});
