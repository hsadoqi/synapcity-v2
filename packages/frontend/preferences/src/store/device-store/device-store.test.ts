import { displaySchema, settingsDefaults } from '@synapcity/domain-preferences';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearStoredPreferences,
  deviceTimezone,
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

  it('lets storage failures reach the runtime that reports them', () => {
    writeStoredPreferences('{"a":1}');
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage blocked');
    });
    expect(() => readStoredPreferences()).toThrow('storage blocked');
    vi.restoreAllMocks();
  });

  it('clears it', () => {
    writeStoredPreferences('{"a":1}');
    clearStoredPreferences();
    expect(localStorage.getItem('synapcity-preferences')).toBeNull();
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
