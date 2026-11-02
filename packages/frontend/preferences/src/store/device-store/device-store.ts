import {
  displaySchema,
  parseCacheOwner,
  serializeCacheOwner,
  type CacheOwner,
  type DisplaySettings,
} from '@synapcity/domain-preferences';
import {
  PREFERENCES_SAVED_EVENT,
  PREFERENCES_STORAGE_KEY,
} from '../../scripts';

/*
 * The one place the browser's saved preferences are read and written
 * (ADR-0010). Each function behaves exactly like the `localStorage` call it
 * replaces, including throwing where `localStorage` throws, so callers keep
 * their own try/catch.
 */

/**
 * This device's own display settings, set aside while the account's display
 * override is in effect, so turning the override off restores them.
 */
const DEVICE_DISPLAY_KEY = 'synapcity-device-display';

/**
 * Whose choices the stored document holds (see `CacheOwner`). Kept beside the
 * document, so the document's own bytes stay in the shape boot scripts read.
 */
export const PREFERENCES_OWNER_KEY = 'synapcity-preferences-owner';

/** The stored preferences document as saved, or null when there is none. */
export function readStoredPreferences(): string | null {
  return localStorage.getItem(PREFERENCES_STORAGE_KEY);
}

/** The stored document, or null when there is none or storage cannot be read. */
export function tryReadStoredPreferences(): string | null {
  try {
    return readStoredPreferences();
  } catch {
    return null;
  }
}

export function writeStoredPreferences(value: string): void {
  localStorage.setItem(PREFERENCES_STORAGE_KEY, value);
}

export function clearStoredPreferences(): void {
  localStorage.removeItem(PREFERENCES_STORAGE_KEY);
}

/** Tells collectors in this tab that the saved choices changed. */
export function announcePreferencesSaved(): void {
  window.dispatchEvent(new Event(PREFERENCES_SAVED_EVENT));
}

/**
 * Calls the listener when another tab writes the stored document (`storage`)
 * and when this tab saves. Returns the unsubscribe.
 */
export function onStoredPreferencesChange(listener: () => void): () => void {
  window.addEventListener('storage', listener);
  window.addEventListener(PREFERENCES_SAVED_EVENT, listener);
  return () => {
    window.removeEventListener('storage', listener);
    window.removeEventListener(PREFERENCES_SAVED_EVENT, listener);
  };
}

/** The document's owner, or null when unmarked (legacy) or unreadable. Throws like localStorage. */
export function readCacheOwner(): CacheOwner | null {
  return parseCacheOwner(localStorage.getItem(PREFERENCES_OWNER_KEY));
}

export function writeCacheOwner(owner: CacheOwner): void {
  localStorage.setItem(PREFERENCES_OWNER_KEY, serializeCacheOwner(owner));
}

export function readDeviceDisplay(): DisplaySettings | null {
  try {
    const saved = localStorage.getItem(DEVICE_DISPLAY_KEY);
    if (!saved) return null;
    const parsed = displaySchema.safeParse(JSON.parse(saved));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function writeDeviceDisplay(value: DisplaySettings | null): void {
  try {
    if (value) localStorage.setItem(DEVICE_DISPLAY_KEY, JSON.stringify(value));
    else localStorage.removeItem(DEVICE_DISPLAY_KEY);
  } catch {
    // Without storage the override still applies for this visit.
  }
}

export function deviceTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
