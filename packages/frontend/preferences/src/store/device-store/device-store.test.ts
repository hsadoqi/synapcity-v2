import { displaySchema, settingsDefaults } from '@synapcity/domain-preferences';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  announcePreferencesSaved,
  clearStoredPreferences,
  deviceTimezone,
  onStoredPreferencesChange,
  readDeviceDisplay,
  readStoredPreferences,
  writeDeviceDisplay,
  writeStoredPreferences,
} from './device-store';

beforeEach(() => localStorage.clear());
afterEach(() => vi.unstubAllGlobals());

describe('device store', () => {
  it('reads and writes the stored document under synapcity-preferences', () => {
    expect(readStoredPreferences()).toBeNull();
    writeStoredPreferences('{"a":1}');
    expect(localStorage.getItem('synapcity-preferences')).toBe('{"a":1}');
    expect(readStoredPreferences()).toBe('{"a":1}');
  });

  it('clears it', () => {
    writeStoredPreferences('{"a":1}');
    clearStoredPreferences();
    expect(localStorage.getItem('synapcity-preferences')).toBeNull();
  });

  it('tells subscribers when another tab or this tab saves, and stops when unsubscribed', () => {
    const listener = vi.fn();
    const unsubscribe = onStoredPreferencesChange(listener);
    window.dispatchEvent(
      new StorageEvent('storage', { key: 'synapcity-preferences' }),
    );
    announcePreferencesSaved();
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
    window.dispatchEvent(new StorageEvent('storage'));
    announcePreferencesSaved();
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('keeps the device display apart under synapcity-device-display', () => {
    expect(readDeviceDisplay()).toBeNull();
    const display = displaySchema.parse(settingsDefaults.appearance);
    writeDeviceDisplay(display);
    expect(localStorage.getItem('synapcity-device-display')).toBe(
      JSON.stringify(display),
    );
    expect(readDeviceDisplay()).toEqual(display);
    expect(localStorage.getItem('synapcity-preferences')).toBeNull();
    writeDeviceDisplay(null);
    expect(localStorage.getItem('synapcity-device-display')).toBeNull();
  });

  it('reads an unreadable device display as nothing, and reports the timezone', () => {
    localStorage.setItem('synapcity-device-display', '{not json');
    expect(readDeviceDisplay()).toBeNull();
    expect(deviceTimezone()).toBe(
      Intl.DateTimeFormat().resolvedOptions().timeZone,
    );
  });
});
