import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { accountPart } from '@synapcity/domain-preferences';
import { stubBrowser } from '../../testing';
import { settingsDefaults, type Settings } from '@synapcity/domain-preferences';
import { AccountPreferencesSync } from './account-preferences-sync';
import { readLookCookie } from '@synapcity/frontend-preferences';

const KEY = 'synapcity-preferences';
const SET_ASIDE_KEY = 'synapcity-device-display';
const html = document.documentElement;

beforeEach(stubBrowser);
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const cached = () => JSON.parse(localStorage.getItem(KEY)!) as Settings;

const account: Settings = {
  ...settingsDefaults,
  regional: { ...settingsDefaults.regional, language: 'de' },
  theme: { ...settingsDefaults.theme, headingFont: 'fraunces' },
};

describe('AccountPreferencesSync (ADR-0010, every page)', () => {
  it('brings a browser that is behind up to date with the account, and caches it', () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        ...settingsDefaults,
        appearance: { ...settingsDefaults.appearance, contrastMode: 'low' },
      }),
    );
    render(<AccountPreferencesSync preferences={accountPart(account)} />);

    // The interface is English only, so the page stays lang="en" (pageLanguage).
    expect(html.lang).toBe('en');
    expect(html.style.getPropertyValue('--font-preference-heading')).toContain(
      'Fraunces',
    );
    expect(cached().regional.language).toBe('de');
    expect(cached().theme.headingFont).toBe('fraunces');
    // Device-only settings stay this browser's own.
    expect(cached().appearance.contrastMode).toBe('low');
    expect(html.dataset.contrast).toBe('low');
  });

  it("applies the display override and sets this device's own values aside", () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        ...settingsDefaults,
        appearance: { ...settingsDefaults.appearance, contrastMode: 'low' },
      }),
    );
    render(
      <AccountPreferencesSync
        preferences={accountPart(settingsDefaults, {
          animationsEnabled: true,
          reducedMotion: false,
          contrastMode: 'high',
          showBorders: false,
        })}
      />,
    );

    expect(html.dataset.contrast).toBe('high');
    expect(JSON.parse(localStorage.getItem(SET_ASIDE_KEY)!).contrastMode).toBe(
      'low',
    );
  });

  it('tells consent-following collectors the saved preferences changed', () => {
    const heard = vi.fn();
    window.addEventListener('synapcity-preferences-saved', heard);
    render(<AccountPreferencesSync preferences={accountPart(account)} />);
    window.removeEventListener('synapcity-preferences-saved', heard);

    expect(heard).toHaveBeenCalledOnce();
  });

  it('still applies and shares the account look when localStorage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    expect(() =>
      render(<AccountPreferencesSync preferences={accountPart(account)} />),
    ).not.toThrow();
    expect(readLookCookie()?.theme.headingFont).toBe('fraunces');
    expect(html.style.getPropertyValue('--font-preference-heading')).toContain(
      'Fraunces',
    );
  });

  it("uses this browser's own language when there is no account copy", () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        ...settingsDefaults,
        regional: { ...settingsDefaults.regional, language: 'fr' },
      }),
    );
    render(<AccountPreferencesSync preferences={null} />);

    expect(html.lang).toBe('en');
    // Nothing to apply, so nothing is rewritten.
    expect(cached().regional.language).toBe('fr');
    expect(localStorage.getItem(SET_ASIDE_KEY)).toBeNull();
  });

  it('falls back to the default language with nothing saved anywhere', () => {
    render(<AccountPreferencesSync preferences={null} />);

    expect(html.lang).toBe('en');
    expect(localStorage.getItem(KEY)).toBeNull();
  });
});
