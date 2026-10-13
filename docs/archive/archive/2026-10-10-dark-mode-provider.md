# Archived: DarkModeProvider

**Original location:** `packages/ui/core/src/providers/dark-mode-provider.tsx`.
**Archived at revision:** `1b02d15` (last commit that touched it).
**Archived on:** 2026-10-10.

## Why

Two providers owned the light / dark / system mode. `ThemeProvider` is the one `apps/web` mounts, tracks both the preference and the resolved mode, and reads the system preference without a hydration mismatch. `DarkModeProvider` wrote the `theme` cookie but did not apply the class for `system`, started its system value as `light`, and set `data-theme`, which only a standalone brand-asset stylesheet reads. ADR-0016 listed consolidating them as separate work; see `docs/superpowers/specs/2026-10-10-theme-mode-provider-consolidation-design.md`.

## Replacement

`ThemeProvider` and `useThemeMode` in `packages/ui/core/src/providers/theme-provider.tsx`. `useDarkModePreference().preference` is `useThemeMode().mode`; `useDarkMode()` is `useThemeMode().resolvedMode`, which can be `null` before the client reads the device preference.

## The removed file

```tsx
'use client';

import React from 'react';
import type {
  DarkModePreference,
  DarkMode,
} from '../components/blocks/dark-mode/dark-mode-preference-toggle';

export const DarkModeContext = React.createContext<{
  preference: DarkModePreference;
  setPreference: (_value: DarkModePreference) => void;
  mode: DarkMode;
} | null>(null);

export const useDarkMode = () => {
  const context = React.useContext(DarkModeContext);
  if (!context) {
    throw new Error('useDarkMode must be used within a DarkModeProvider');
  }
  return context.mode;
};

export const useDarkModePreference = () => {
  const context = React.useContext(DarkModeContext);
  if (!context) {
    throw new Error(
      'useDarkModePreference must be used within a DarkModeProvider',
    );
  }
  return {
    preference: context.preference,
    setPreference: context.setPreference,
  };
};

export const DarkModeProvider = ({
  initialModePreference,
  children,
}: {
  initialModePreference: DarkModePreference;
  children: React.ReactNode;
}) => {
  const [preference, setPreference] = React.useState<DarkModePreference>(
    initialModePreference,
  );
  const [systemMode, setSystemMode] = React.useState<DarkMode>('light');
  const mode = preference === 'system' ? systemMode : preference;

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const updateSystemMode = () =>
      setSystemMode(mediaQuery.matches ? 'dark' : 'light');

    updateSystemMode();
    mediaQuery.addEventListener('change', updateSystemMode);
    return () => mediaQuery.removeEventListener('change', updateSystemMode);
  }, []);

  const onPreferenceChange = React.useCallback((value: DarkModePreference) => {
    setPreference(value);

    const root = document.documentElement;
    root.classList.toggle('dark', value === 'dark');
    root.classList.toggle('light', value === 'light');
    root.dataset.theme = value;
    document.cookie = `theme=${value}; Path=/; Max-Age=31536000; SameSite=Lax${window.location.protocol === 'https:' ? '; Secure' : ''}`;
  }, []);

  const contextValue = React.useMemo(
    () => ({
      preference,
      setPreference: onPreferenceChange,
      mode,
    }),
    [mode, onPreferenceChange, preference],
  );

  return (
    <DarkModeContext.Provider value={contextValue}>
      {children}
    </DarkModeContext.Provider>
  );
};
```
