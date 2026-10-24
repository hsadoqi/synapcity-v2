'use client';

import { useCallback } from 'react';
import type { AppearanceSettingsPatch } from '@synapcity/domain-preferences';
import { useSettings } from '../use-settings';

export function useAppearanceSettings() {
  const { settings, updateSettings } = useSettings();
  const updateAppearance = useCallback(
    (patch: AppearanceSettingsPatch) => {
      updateSettings({ appearance: patch });
    },
    [updateSettings],
  );
  return { appearance: settings.appearance, updateAppearance };
}
