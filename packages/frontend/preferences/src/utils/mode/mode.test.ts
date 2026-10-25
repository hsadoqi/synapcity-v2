import { afterEach, describe, expect, it, vi } from 'vitest';
import { mockViewport } from '@synapcity/dev-vitest-config/viewport';
import { isMode, isResolvedMode, resolveMode, resolveSystemMode } from './mode';

afterEach(() => vi.unstubAllGlobals());

describe('mode helpers', () => {
  it('knows the three modes', () => {
    expect(['light', 'dark', 'system'].every(isMode)).toBe(true);
    expect(isMode('auto')).toBe(false);
    expect(isMode(undefined)).toBe(false);
  });

  it('knows the two resolved modes', () => {
    expect(isResolvedMode('light')).toBe(true);
    expect(isResolvedMode('dark')).toBe(true);
    expect(isResolvedMode('system')).toBe(false);
  });

  it('keeps an explicit mode as it is', () => {
    expect(resolveMode('light')).toBe('light');
    expect(resolveMode('dark')).toBe('dark');
  });

  it('follows the system for system and for nothing', () => {
    mockViewport({ dark: true });
    expect(resolveMode('system')).toBe('dark');
    expect(resolveMode(undefined)).toBe('dark');
    mockViewport();
    expect(resolveMode('system')).toBe('light');
    expect(resolveMode(undefined)).toBe('light');
  });

  it('reads the operating system preference', () => {
    mockViewport({ dark: true });
    expect(resolveSystemMode()).toBe('dark');
    mockViewport();
    expect(resolveSystemMode()).toBe('light');
  });
});
