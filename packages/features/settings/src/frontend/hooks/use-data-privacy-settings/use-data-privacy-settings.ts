'use client';

import { useCallback } from 'react';
import { useGlobalPrivacyControl } from '@synapcity/frontend-preferences';
import {
  choose,
  type DataPrivacySettingsPatch,
  type PrivacyPurpose,
} from '@synapcity/domain-preferences';
import { useSettings } from '../use-settings';

export function useDataPrivacySettings() {
  const { settings, updateSettings } = useSettings();
  const globalPrivacyControl = useGlobalPrivacyControl();
  // Every choice records when it was made and which wording it was made under.
  const setConsent = useCallback(
    (purpose: PrivacyPurpose, granted: boolean) => {
      const patch: DataPrivacySettingsPatch = {};
      patch[purpose] = choose(purpose, granted);
      updateSettings({ privacy: patch });
    },
    [updateSettings],
  );
  return {
    privacy: settings.privacy,
    signals: { globalPrivacyControl },
    setConsent,
  };
}
