'use client';

import { useCallback } from 'react';
import type { ThemeSettingsPatch } from '../types/theme';
import { useSettings } from './use-settings';

export function useThemeSettings() {
  const { settings, updateSettings } = useSettings();
  const updateTheme = useCallback(
    (patch: ThemeSettingsPatch) => {
      updateSettings({ theme: patch });
    },
    [updateSettings],
  );
  return { theme: settings.theme, updateTheme };
}
