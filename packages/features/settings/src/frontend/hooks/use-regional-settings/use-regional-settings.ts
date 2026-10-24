'use client';

import { useCallback } from 'react';
import type { RegionalSettingsPatch } from '@synapcity/domain-preferences';
import { useSettings } from '../use-settings';

export function useRegionalSettings() {
  const { settings, updateSettings } = useSettings();
  const updateRegional = useCallback(
    (patch: RegionalSettingsPatch) => {
      updateSettings({ regional: patch });
    },
    [updateSettings],
  );
  return { regional: settings.regional, updateRegional };
}
