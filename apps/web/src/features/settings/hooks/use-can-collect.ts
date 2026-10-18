'use client';

import { useMemo, useSyncExternalStore } from 'react';
import { parseImport } from '../lib/settings';
import {
  PREFERENCES_SAVED_EVENT,
  PREFERENCES_STORAGE_KEY,
} from '../shared/appearance-attributes';
import { canCollect } from '../shared/privacy-consent';
import type { PrivacyPurpose } from '../types/data-privacy';
import { useGlobalPrivacyControl } from './use-global-privacy-control';

function subscribe(onChange: () => void) {
  window.addEventListener('storage', onChange);
  window.addEventListener(PREFERENCES_SAVED_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(PREFERENCES_SAVED_EVENT, onChange);
  };
}

function readStored() {
  try {
    return localStorage.getItem(PREFERENCES_STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Whether a collector may run, from the saved choice. Unlike the settings
 * hooks it needs no provider, so a collector can sit anywhere in the app. It
 * follows changes from the settings page in this tab and in others. Anything
 * missing or unreadable counts as not granted.
 */
export function useCanCollect(purpose: PrivacyPurpose) {
  const stored = useSyncExternalStore(subscribe, readStored, () => null);
  const globalPrivacyControl = useGlobalPrivacyControl();
  return useMemo(() => {
    if (!stored) return false;
    try {
      const { privacy } = parseImport(JSON.parse(stored)).settings;
      return canCollect(privacy, purpose, { globalPrivacyControl });
    } catch {
      return false;
    }
  }, [stored, purpose, globalPrivacyControl]);
}
