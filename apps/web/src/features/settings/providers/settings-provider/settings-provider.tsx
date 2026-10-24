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
import { useMode } from '@synapcity/frontend-preferences';
import {
  mergeSettings,
  parseImport,
  withoutStoredAccount,
} from '@synapcity/domain-preferences';
import { reconcile } from '@synapcity/domain-preferences';
import type { AccountSync } from '../../lib/account-sync';
import {
  accountPart,
  displayOf,
  isDefaultAccount,
  touchesAccount,
  type DisplaySettings,
} from '@synapcity/domain-preferences';
import { applyFontPreferences } from '@synapcity/frontend-preferences';
import { applyThemeShape } from '@synapcity/frontend-preferences';
import { settingsDefaults } from '@synapcity/domain-preferences';
import type { Settings, SettingsPatch } from '@synapcity/domain-preferences';
import { themeSchema } from '@synapcity/domain-preferences';
import { pageLanguage } from '@synapcity/domain-preferences';
import {
  applyAppearance,
  announcePreferencesSaved,
  clearStoredPreferences,
  deviceTimezone,
  readDeviceDisplay,
  readStoredPreferences,
  writeDeviceDisplay,
  writeStoredPreferences,
} from '@synapcity/frontend-preferences';

const NOT_SAVED_TO_ACCOUNT =
  'Changes apply on this device, but could not be saved to your account.';

type SettingsContextType = {
  settings: Settings;
  updateSettings: (patch: SettingsPatch) => void;
  status: string;
  name: string | null;
  updateName: (name: string) => void;
  isReady: boolean;
  /** Whether account preferences are saved to the account (signed in). */
  syncsToAccount: boolean;
  /** Whether display settings apply on all the person's devices. */
  displayOnAllDevices: boolean;
  setDisplayOnAllDevices: (on: boolean) => void;
};

export const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({
  children,
  name: initialName = null,
  account,
}: {
  children: ReactNode;
  name?: string | null;
  /** Signed in: the saved account preferences and how to save them (ADR-0010). */
  account?: AccountSync;
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
  // Read once, at load, like browser storage; later saves go through `persist`.
  const accountSync = useRef(account);
  const override = useRef<DisplaySettings | null>(null);
  const [displayOverride, setDisplayOverride] =
    useState<DisplaySettings | null>(null);
  const saveCount = useRef(0);
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

  /** Saves the account part of `next`. The newest save's outcome is reported. */
  const persist = useCallback((next: Settings) => {
    const sync = accountSync.current;
    if (!sync) return;
    const count = ++saveCount.current;
    const report = (error: string | null) => {
      if (count === saveCount.current && error) setStatus(error);
    };
    sync.save(accountPart(next, override.current), deviceTimezone()).then(
      (result) =>
        report(
          result.ok
            ? null
            : result.signedOut
              ? result.error
              : NOT_SAVED_TO_ACCOUNT,
        ),
      () => report(NOT_SAVED_TO_ACCOUNT),
    );
  }, []);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      try {
        let saved = readStoredPreferences();
        if (saved) {
          // Remove the account entry an earlier version stored here.
          const cleaned = withoutStoredAccount(saved);
          if (cleaned !== undefined) {
            try {
              if (cleaned === null) clearStoredPreferences();
              else writeStoredPreferences(cleaned);
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
      loadAccount();
      ready.current = true;
      setIsReady(true);
    });
    return () => {
      cancelled = true;
    };

    // The account's own part wins over this browser's copy (ADR-0010).
    function loadAccount() {
      const sync = accountSync.current;
      if (!sync) return;
      const local = current.current;
      const stored = sync.stored.preferences;
      if (!stored) {
        // First load since signing in: keep choices made before, if any.
        if (!isDefaultAccount(accountPart(local))) persist(local);
        return;
      }
      const reconciled = reconcile(local, stored, readDeviceDisplay());
      writeDeviceDisplay(reconciled.setAside);
      override.current = stored.appearanceOverride ?? null;
      setDisplayOverride(override.current);
      current.current = reconciled.settings;
      setStoredSettings(reconciled.settings);
      try {
        // Cache it, so the boot scripts paint these values on the next load.
        writeStoredPreferences(JSON.stringify(reconciled.settings));
        announcePreferencesSaved();
      } catch {
        // Still applied for this visit.
      }
      if (sync.stored.deviceTimezone !== deviceTimezone()) {
        persist(reconciled.settings);
      }
    }
  }, [persist]);

  const { animationsEnabled, showBorders, reducedMotion, contrastMode } =
    appearance;
  useEffect(() => {
    // Wait for the saved settings: until then these are the defaults, and
    // applying them would undo what the boot script set before first paint.
    if (!isReady) return;
    // Styled by tokens/preferences.css; the boot script in the root layout
    // sets the same attributes before first paint.
    applyAppearance(document.documentElement, {
      animationsEnabled,
      showBorders,
      reducedMotion,
      contrastMode,
    });
  }, [isReady, animationsEnabled, showBorders, reducedMotion, contrastMode]);

  const { headingFont, bodyFont, codeFont } = settings.theme;
  useEffect(() => {
    // Same wait as above: the default fonts must not clear the saved ones.
    if (!isReady) return;
    // Loads a chosen family from Google Fonts on first use; see font-preferences.
    applyFontPreferences(document.documentElement, {
      headingFont,
      bodyFont,
      codeFont,
    });
  }, [isReady, headingFont, bodyFont, codeFont]);

  const { radius, density, textSize } = settings.theme;
  useEffect(() => {
    // Same wait as above: the default shape must not undo the saved one.
    if (!isReady) return;
    // Styled by tokens/preferences.css; the boot script in the root layout sets
    // the same attributes before first paint.
    applyThemeShape(document.documentElement, { radius, density, textSize });
  }, [isReady, radius, density, textSize]);

  const { language } = settings.regional;
  useEffect(() => {
    // Same wait as above. The root layout renders `lang="en"`; this follows
    // the saved choice once the interface is written in it (see pageLanguage).
    if (!isReady) return;
    document.documentElement.lang = pageLanguage(language);
  }, [isReady, language]);

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
        writeStoredPreferences(JSON.stringify(next));
        announcePreferencesSaved();
        setStatus('Saved');
      } catch {
        setStatus('Changes applied. Browser storage is unavailable.');
      }
      // While display settings apply everywhere, a display change is an
      // account change too.
      const displayChanged = Boolean(override.current && patch.appearance);
      if (displayChanged) {
        override.current = displayOf(next);
        setDisplayOverride(override.current);
      }
      if (displayChanged || touchesAccount(patch)) persist(next);
    },
    [mode, setMode, persist],
  );

  const setDisplayOnAllDevices = useCallback(
    (on: boolean) => {
      if (!ready.current || !accountSync.current) return;
      const now = current.current;
      let next = now;
      if (on) {
        // Keep this device's own values, to restore when this is turned off.
        writeDeviceDisplay(displayOf(now));
        override.current = displayOf(now);
      } else {
        const own = readDeviceDisplay();
        writeDeviceDisplay(null);
        override.current = null;
        if (own) next = mergeSettings(now, { appearance: own });
      }
      setDisplayOverride(override.current);
      current.current = next;
      setStoredSettings(next);
      try {
        writeStoredPreferences(JSON.stringify(next));
        announcePreferencesSaved();
        setStatus('Saved');
      } catch {
        setStatus('Changes applied. Browser storage is unavailable.');
      }
      persist(next);
    },
    [persist],
  );

  const syncsToAccount = account !== undefined;
  const displayOnAllDevices = displayOverride !== null;
  const value = useMemo(
    () => ({
      settings,
      updateSettings,
      status,
      name,
      updateName,
      isReady,
      syncsToAccount,
      displayOnAllDevices,
      setDisplayOnAllDevices,
    }),
    [
      settings,
      updateSettings,
      status,
      name,
      isReady,
      syncsToAccount,
      displayOnAllDevices,
      setDisplayOnAllDevices,
    ],
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}
