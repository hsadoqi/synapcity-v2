import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  LOOK_COOKIE_NAME,
  lookOf,
  settingsDefaults,
} from '@synapcity/domain-preferences';
import { appearanceBootScript } from './appearance-attributes';
import { fontBootScript } from './font-preferences';
import { themeShapeBootScript } from './theme-shape';

const run = () => {
  for (const script of [
    appearanceBootScript,
    themeShapeBootScript,
    fontBootScript,
  ])
    new Function(script)();
};

const defaults = lookOf(settingsDefaults);
const setCookie = (value: unknown) => {
  document.cookie = `${LOOK_COOKIE_NAME}=${encodeURIComponent(typeof value === 'string' ? value : JSON.stringify(value))}; Path=/`;
};
const lookWith = (
  theme: Record<string, unknown>,
  appearance: Record<string, unknown> = {},
) => ({
  ...defaults,
  theme: { ...defaults.theme, ...theme },
  appearance: { ...defaults.appearance, ...appearance },
});
const root = () => document.documentElement;

beforeEach(() => {
  localStorage.clear();
  document.cookie = `${LOOK_COOKIE_NAME}=; Path=/; Max-Age=0`;
  for (const key of Object.keys(root().dataset)) delete root().dataset[key];
  root().removeAttribute('style');
  document.head.innerHTML = '';
});
afterEach(() => localStorage.clear());

describe('boot scripts with the shared look cookie', () => {
  it('applies the look from the cookie', () => {
    setCookie(
      lookWith(
        { density: 'compact', textSize: 120, radius: 'soft' },
        { contrastMode: 'high' },
      ),
    );
    run();
    expect(root().dataset.density).toBe('compact');
    expect(root().dataset.textSize).toBe('120');
    expect(root().dataset.radius).toBe('soft');
    expect(root().dataset.contrast).toBe('high');
    expect(root().style.getPropertyValue('--text-scale')).toBe('1.2');
  });

  it('prefers the cookie over localStorage', () => {
    localStorage.setItem(
      'synapcity-preferences',
      JSON.stringify({ theme: { density: 'spacious' } }),
    );
    setCookie(lookWith({ density: 'compact' }));
    run();
    expect(root().dataset.density).toBe('compact');
  });

  it('prefers the server-resolved look over cookie and localStorage', () => {
    root().setAttribute(
      'data-synapcity-look',
      JSON.stringify(lookWith({ density: 'compact', textSize: 120 })),
    );
    setCookie(lookWith({ density: 'spacious', textSize: 130 }));
    localStorage.setItem(
      'synapcity-preferences',
      JSON.stringify({ theme: { density: 'comfortable', textSize: 90 } }),
    );

    run();

    expect(root().dataset.density).toBe('compact');
    expect(root().dataset.textSize).toBe('120');
  });

  it('falls back to localStorage with no cookie', () => {
    localStorage.setItem(
      'synapcity-preferences',
      JSON.stringify({ theme: { density: 'spacious' } }),
    );
    run();
    expect(root().dataset.density).toBe('spacious');
  });

  it('ignores a newer or malformed cookie and falls back', () => {
    localStorage.setItem(
      'synapcity-preferences',
      JSON.stringify({ theme: { density: 'spacious' } }),
    );
    for (const bad of [
      { ...lookWith({ density: 'compact' }), v: 2 },
      '{not json',
      { v: 1, theme: 'x', appearance: {} },
    ]) {
      for (const key of Object.keys(root().dataset)) delete root().dataset[key];
      setCookie(bad);
      expect(run).not.toThrow();
      expect(root().dataset.density).toBe('spacious');
    }
  });

  it('writes no attribute from a tampered value', () => {
    setCookie(lookWith({ radius: 'url(x)', textSize: 9999 }));
    run();
    expect(root().dataset.radius).toBe('default');
    expect(root().dataset.textSize).toBe('100');
  });

  it('uses defaults with neither', () => {
    run();
    expect(root().dataset.density).toBe('comfortable');
    expect(root().dataset.contrast).toBe('none');
  });

  it('loads only catalog fonts from the cookie', () => {
    setCookie(lookWith({ headingFont: 'not-a-font' }));
    run();
    expect(
      document.head.querySelectorAll('link[rel="stylesheet"]').length,
    ).toBe(0);
    expect(root().style.getPropertyValue('--font-preference-heading')).toBe('');
  });
});
