'use client';

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useMode } from '@synapcity/frontend-ui/providers/mode-provider';
import {
  mergeSettings,
  parseImport,
  withoutStoredAccount,
} from '../lib/settings';
import { settingsDefaults } from '../types/settings';
import type { Settings, SettingsPatch } from '../types';
import { themeSchema } from '../types/theme';
import {
  applyAppearance,
  PREFERENCES_STORAGE_KEY,
} from '../shared/appearance-attributes';

const STORAGE_KEY = PREFERENCES_STORAGE_KEY;

type SettingsContextType = {
  settings: Settings;
  updateSettings: (patch: SettingsPatch) => void;
  status: string;
  name: string | null;
  updateName: (name: string) => void;
  isReady: boolean;
};

export const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({
  children,
  name: initialName = null,
}: {
  children: ReactNode;
  name?: string | null;
}) {
  const [storedSettings, setStoredSettings] = useState(settingsDefaults);
  const current = useRef(settingsDefaults);
  const ready = useRef(false);
  const [isReady, setIsReady] = useState(false);
  const [name, updateName] = useState(initialName);
  // The page re-renders with the saved name after a profile edit. Follow it,
  // instead of keeping the name the page first loaded with. This is the
  // supported way to derive state from a changed prop without an effect.
  const [loadedName, setLoadedName] = useState(initialName);
  if (loadedName !== initialName) {
    setLoadedName(initialName);
    updateName(initialName);
  }
  const [status, setStatus] = useState('');
  const { nativeMode, setMode } = useMode();
  const parsedMode = themeSchema.shape.mode.safeParse(nativeMode);
  // The existing root ModeProvider owns color mode, including changes elsewhere.
  const mode = parsedMode.success ? parsedMode.data : storedSettings.theme.mode;
  const settings = useMemo(
    () => ({
      ...storedSettings,
      theme: { ...storedSettings.theme, mode },
      appearance: { ...storedSettings.appearance, colorScheme: mode },
    }),
    [storedSettings, mode],
  );

  const { appearance } = settings;

  useEffect(() => {
    current.current = settings;
  }, [settings]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      try {
        let saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          // Remove the account entry an earlier version stored here.
          const cleaned = withoutStoredAccount(saved);
          if (cleaned !== undefined) {
            try {
              if (cleaned === null) localStorage.removeItem(STORAGE_KEY);
              else localStorage.setItem(STORAGE_KEY, cleaned);
            } catch {
              // Still read the rest below; the entry is ignored either way.
            }
            saved = cleaned;
          }
        }
        if (saved) {
          try {
            const restored = parseImport(JSON.parse(saved)).settings;
            current.current = restored;
            setStoredSettings(restored);
          } catch {
            setStatus(
              'Saved preferences could not be loaded. Defaults are in use.',
            );
          }
        }
      } catch {
        setStatus('Storage unavailable. Changes apply for this visit.');
      }
      ready.current = true;
      setIsReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const {
    animationsEnabled,
    showBorders,
    reducedMotion,
    contrastMode,
    fontSize,
  } = appearance;
  useEffect(() => {
    // Styled by tokens/preferences.css; the boot script in the root layout
    // sets the same attributes before first paint.
    applyAppearance(document.documentElement, {
      animationsEnabled,
      showBorders,
      reducedMotion,
      contrastMode,
      fontSize,
    });
  }, [animationsEnabled, showBorders, reducedMotion, contrastMode, fontSize]);

  useEffect(() => {
    if (status !== 'Saved') return;
    const timer = setTimeout(() => setStatus(''), 3000);
    return () => clearTimeout(timer);
  }, [status, storedSettings]);

  const updateSettings = useCallback(
    (patch: SettingsPatch) => {
      if (!ready.current) {
        setStatus('Preferences are still loading. Please try again.');
        return;
      }
      let next: Settings;
      try {
        next = mergeSettings(current.current, patch);
      } catch {
        setStatus(
          'Preferences could not be updated. Check the selected values.',
        );
        return;
      }
      current.current = next;
      setStoredSettings(next);
      if (next.theme.mode !== mode) setMode(next.theme.mode);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        setStatus('Saved');
      } catch {
        setStatus('Changes applied. Browser storage is unavailable.');
      }
    },
    [mode, setMode],
  );

  const value = useMemo(
    () => ({ settings, updateSettings, status, name, updateName, isReady }),
    [settings, updateSettings, status, name, isReady],
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}
