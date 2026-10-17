'use client';

import { useCallback, useState } from 'react';
import type { ThemeSettings, ThemeSettingsPatch } from '../types/theme';
import { useThemeSettings } from './use-theme-settings';

/**
 * Theme choices held locally until they are saved, so the previews can show a
 * choice before the whole workspace switches to it.
 *
 * The draft is the saved theme with the local changes laid over it, not a copy
 * taken on mount: a value saved elsewhere (an import, another tab) still shows
 * through every field nobody has touched here. `save` sends only the fields that
 * differ from what is saved.
 */
export function useThemeDraft() {
  const { theme, updateTheme } = useThemeSettings();
  const [changes, setChanges] = useState<ThemeSettingsPatch>({});

  const draft: ThemeSettings = { ...theme, ...changes };
  const unsaved = (Object.keys(changes) as (keyof ThemeSettings)[]).filter(
    (key) => changes[key] !== theme[key],
  );

  const change = useCallback((patch: ThemeSettingsPatch) => {
    setChanges((current) => ({ ...current, ...patch }));
  }, []);

  const save = () => {
    updateTheme(
      Object.fromEntries(
        unsaved.map((key) => [key, draft[key]]),
      ) as ThemeSettingsPatch,
    );
    setChanges({});
  };

  return { draft, change, save, hasChanges: unsaved.length > 0 };
}
