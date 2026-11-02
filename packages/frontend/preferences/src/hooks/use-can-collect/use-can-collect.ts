'use client';

import { useMemo, useSyncExternalStore } from 'react';
import {
  canCollect,
  parseImport,
  type PrivacyPurpose,
} from '@synapcity/domain-preferences';
import {
  onStoredPreferencesChange,
  tryReadStoredPreferences,
} from '../../store';
import { useGlobalPrivacyControl } from '../use-global-privacy-control';

/**
 * Whether a collector may run, from the saved choice. Unlike the settings
 * hooks it needs no provider, so a collector can sit anywhere in the app. It
 * follows changes from the settings page in this tab and in others. Anything
 * missing or unreadable counts as not granted.
 */
export function useCanCollect(purpose: PrivacyPurpose) {
  const stored = useSyncExternalStore(
    onStoredPreferencesChange,
    tryReadStoredPreferences,
    () => null,
  );
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
