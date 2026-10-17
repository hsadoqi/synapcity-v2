'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ThemeSettings, ThemeSettingsPatch } from '../types/theme';
import { useThemeSettings } from './use-theme-settings';

/**
 * Theme choices held locally until they are saved, so the previews can show a
 * choice before the whole workspace switches to it.
 *
 * The draft is the saved theme with the local changes laid over it, not a copy
 * taken on mount: a value saved elsewhere (an import, another tab) still shows
 * through every field nobody has touched here. `save` sends only the fields that
 * differ from what is saved; `discard` drops them. While anything is unsaved the
 * browser asks before the page is closed or reloaded.
 */
export function useThemeDraft() {
  const { theme, updateTheme } = useThemeSettings();
  const [changes, setChanges] = useState<ThemeSettingsPatch>({});

  const draft: ThemeSettings = { ...theme, ...changes };
  const unsaved = (Object.keys(changes) as (keyof ThemeSettings)[]).filter(
    (key) => changes[key] !== theme[key],
  );
  const hasChanges = unsaved.length > 0;

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

  const discard = useCallback(() => setChanges({}), []);

  useEffect(() => {
    if (!hasChanges) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [hasChanges]);

  return { draft, change, save, discard, hasChanges };
}
