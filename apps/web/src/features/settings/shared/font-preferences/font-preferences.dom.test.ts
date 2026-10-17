import { beforeEach, describe, expect, it } from 'vitest';

import { PREFERENCES_STORAGE_KEY } from '../appearance-attributes';
import { fontStack, fontStylesheetUrl } from '../../types/fonts';
import { applyFontPreferences, fontBootScript } from './font-preferences';

const root = () => document.documentElement;
const stylesheets = () =>
  [...document.head.querySelectorAll('link[rel="stylesheet"]')].map((link) =>
    link.getAttribute('href'),
  );
const none = {
  headingFont: 'default',
  bodyFont: 'default',
  codeFont: 'default',
} as const;

beforeEach(() => {
  localStorage.clear();
  document.head.innerHTML = '';
  root().removeAttribute('style');
});

describe('applyFontPreferences', () => {
  it('loads and writes nothing while every role is the default', () => {
    applyFontPreferences(root(), none);
    expect(stylesheets()).toEqual([]);
    expect(document.head.querySelector('link')).toBeNull();
    expect(root().style.getPropertyValue('--font-preference-body')).toBe('');
  });

  it('writes one override per chosen role and fetches only those families', () => {
    applyFontPreferences(root(), {
      headingFont: 'playfair-display',
      bodyFont: 'default',
      codeFont: 'jetbrains-mono',
    });
    const style = root().style;
    expect(style.getPropertyValue('--font-preference-heading')).toBe(
      fontStack('playfair-display'),
    );
    expect(style.getPropertyValue('--font-preference-code')).toBe(
      fontStack('jetbrains-mono'),
    );
    expect(style.getPropertyValue('--font-preference-body')).toBe('');
    expect(stylesheets()).toEqual([
      fontStylesheetUrl('playfair-display'),
      fontStylesheetUrl('jetbrains-mono'),
    ]);
  });

  it('does not fetch a family twice, even for two roles or repeated calls', () => {
    const both = {
      ...none,
      headingFont: 'dm-sans',
      bodyFont: 'dm-sans',
    } as const;
    applyFontPreferences(root(), both);
    applyFontPreferences(root(), both);
    expect(stylesheets()).toEqual([fontStylesheetUrl('dm-sans')]);
  });

  it('connects to Google once', () => {
    applyFontPreferences(root(), { ...none, headingFont: 'lora' });
    applyFontPreferences(root(), { ...none, bodyFont: 'roboto' });
    expect(
      document.head.querySelectorAll('link[rel="preconnect"]'),
    ).toHaveLength(2);
  });

  it('fetches a family without blocking rendering, and switches it on when it arrives', () => {
    applyFontPreferences(root(), { ...none, headingFont: 'lora' });

    const link = document.getElementById(
      'font-preference-lora',
    ) as HTMLLinkElement;
    expect(link.media).toBe('print');
    link.dispatchEvent(new Event('load'));
    expect(link.media).toBe('all');
  });

  it('removes the override when a role returns to the default', () => {
    applyFontPreferences(root(), { ...none, headingFont: 'lora' });
    applyFontPreferences(root(), none);
    expect(root().style.getPropertyValue('--font-preference-heading')).toBe('');
  });
});

function boot(saved?: string) {
  if (saved !== undefined) {
    localStorage.setItem(PREFERENCES_STORAGE_KEY, saved);
  }
  // The script is the string the layout inlines; run it as the browser would.
  new Function(fontBootScript)();
}

describe('fontBootScript', () => {
  it('does nothing when nothing is saved', () => {
    boot();
    expect(document.head.querySelector('link')).toBeNull();
    expect(root().getAttribute('style')).toBeNull();
  });

  it('applies saved fonts exactly as the provider would', () => {
    const theme = {
      mode: 'dark',
      headingFont: 'fraunces',
      bodyFont: 'literata',
      codeFont: 'fira-code',
    } as const;
    boot(JSON.stringify({ theme }));
    const fromBoot = {
      html: root().getAttribute('style'),
      links: stylesheets(),
    };

    document.head.innerHTML = '';
    root().removeAttribute('style');
    applyFontPreferences(root(), theme);
    expect({
      html: root().getAttribute('style'),
      links: stylesheets(),
    }).toEqual(fromBoot);
  });

  it('fetches without blocking rendering, as the provider does', () => {
    boot(JSON.stringify({ theme: { headingFont: 'lora' } }));

    const link = document.getElementById(
      'font-preference-lora',
    ) as HTMLLinkElement;
    expect(link.media).toBe('print');
    link.dispatchEvent(new Event('load'));
    expect(link.media).toBe('all');
  });

  it('shares link ids with the provider so a family is not fetched twice', () => {
    boot(JSON.stringify({ theme: { headingFont: 'lora' } }));
    applyFontPreferences(root(), { ...none, headingFont: 'lora' });
    expect(stylesheets()).toEqual([fontStylesheetUrl('lora')]);
  });

  it.each([
    ['not json', '{invalid'],
    ['null', 'null'],
    ['a string theme', JSON.stringify({ theme: 'dark' })],
    [
      'unknown ids',
      JSON.stringify({
        theme: { headingFont: 'evil.example/x', bodyFont: 42, codeFont: null },
      }),
    ],
    [
      'inherited keys',
      JSON.stringify({ theme: { headingFont: 'constructor' } }),
    ],
  ])('never throws or writes anything for %s', (_name, saved) => {
    expect(() => boot(saved)).not.toThrow();
    expect(root().getAttribute('style')).toBeNull();
    expect(stylesheets()).toEqual([]);
  });
});
