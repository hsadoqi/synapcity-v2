'use client';

import { useCallback } from 'react';
import { useGlobalPrivacyControl } from './use-global-privacy-control';
import {
  PRIVACY_POLICY_VERSION,
  type DataPrivacySettingsPatch,
  type PrivacyPurpose,
} from '../types/data-privacy';
import { useSettings } from './use-settings';

export function useDataPrivacySettings() {
  const { settings, updateSettings } = useSettings();
  const globalPrivacyControl = useGlobalPrivacyControl();
  // Every choice records when it was made and which wording it was made under.
  const setConsent = useCallback(
    (purpose: PrivacyPurpose, granted: boolean) => {
      const patch: DataPrivacySettingsPatch = {
        policyVersion: PRIVACY_POLICY_VERSION,
      };
      patch[purpose] = { granted, updatedAt: new Date().toISOString() };
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
