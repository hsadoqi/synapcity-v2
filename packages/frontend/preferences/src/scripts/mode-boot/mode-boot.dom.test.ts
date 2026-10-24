import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  LOOK_COOKIE_NAME,
  lookOf,
  settingsDefaults,
} from '@synapcity/domain-preferences';
import { modeBootScript } from './mode-boot';

const setMode = (mode: string) => {
  const look = lookOf(settingsDefaults);
  document.cookie = `${LOOK_COOKIE_NAME}=${encodeURIComponent(JSON.stringify({ ...look, theme: { ...look.theme, mode } }))}; Path=/`;
};
const run = () => new Function(modeBootScript)();
const root = () => document.documentElement;

beforeEach(() => {
  localStorage.clear();
  document.cookie = `${LOOK_COOKIE_NAME}=; Path=/; Max-Age=0`;
  root().className = '';
  root().removeAttribute('style');
  vi.unstubAllGlobals();
});

describe('mode boot script', () => {
  it.each(['dark', 'light'] as const)(
    'seeds next-themes and the root from a cookie mode %s',
    (mode) => {
      setMode(mode);
      run();
      expect(localStorage.getItem('theme')).toBe(mode);
      expect(root().classList.contains(mode)).toBe(true);
      expect(root().style.colorScheme).toBe(mode);
    },
  );

  it('resolves system from the operating system', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    setMode('system');
    run();
    expect(localStorage.getItem('theme')).toBe('system');
    expect(root().classList.contains('dark')).toBe(true);
  });

  it('does nothing without a valid cookie', () => {
    run();
    setMode('purple');
    run();
    document.cookie = `${LOOK_COOKIE_NAME}=${encodeURIComponent('{"v":2}')}; Path=/`;
    expect(run).not.toThrow();
    expect(localStorage.getItem('theme')).toBeNull();
    expect(root().className).toBe('');
  });
});
