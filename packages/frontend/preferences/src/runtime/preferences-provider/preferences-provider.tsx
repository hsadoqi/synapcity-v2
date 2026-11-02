'use client';

import {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import {
  canCollect,
  mergeSettings,
  resolveDateTimeFormatting,
  settingsDefaults,
  type DateTimeFormatting,
  type Look,
  type PreferencesSession,
  type PrivacyPurpose,
  type RegionalSettings,
  type Settings,
  type SettingsPatch,
} from '@synapcity/domain-preferences';
import { useMode } from '../../providers/mode-provider';
import { deviceTimezone } from '../../store';
import { useGlobalPrivacyControl } from '../../hooks/use-global-privacy-control';
import {
  createPreferencesStore,
  type PreferencesSnapshot,
  type PreferencesStore,
  type SaveAccountPreferences,
} from '../preferences-store';

/** Fixed values: a preview, a story or a test, or no provider at all. */
function createStaticStore(
  settings: Settings,
  serverTimeZone: string | null,
): PreferencesStore {
  const base = {
    settings,
    sync: 'none',
    displayOnAllDevices: false,
    accountSave: 'idle',
    accountFailure: 'none',
    accountFailureMessage: null,
    status: { kind: 'idle' },
    statusId: 0,
  } as const;
  const server: PreferencesSnapshot = {
    ...base,
    phase: 'server',
    timeZone: serverTimeZone,
  };
  let client: PreferencesSnapshot | null = null;
  const refused = () => false;
  const nothing = () => {};
  return {
    subscribe: () => nothing,
    // The browser's zone is read once, on first use in the browser.
    getSnapshot: () =>
      (client ??= { ...base, phase: 'ready', timeZone: deviceTimezone() }),
    getServerSnapshot: () => server,
    start: () => nothing,
    setHost: nothing,
    bindMode: nothing,
    update: refused,
    setDisplayOnAllDevices: nothing,
    retryAccountSave: nothing,
  };
}

const defaultStore = createStaticStore(settingsDefaults, null);
const PreferencesContext = createContext<PreferencesStore>(defaultStore);

/**
 * The one runtime owner of the person's preferences (ADR-0010). The host's
 * server layout reads the session and the request's look and passes them in;
 * this resolves them against the browser's cached copy after hydration,
 * applies them to the document and keeps every copy in step. It must sit
 * inside `ModeProvider`, which owns colour mode.
 *
 * Changing `session` in place (sign-in, sign-out, another account) re-resolves
 * without remounting the tree.
 */
export function PreferencesProvider({
  session,
  look = null,
  saveAccountPreferences,
  children,
}: {
  session: PreferencesSession;
  /** The validated look cookie of this request, already on <html>. */
  look?: Look | null;
  /** Saves the account part; omit where nothing may be saved. */
  saveAccountPreferences?: SaveAccountPreferences;
  children: ReactNode;
}) {
  const [store] = useState(() =>
    createPreferencesStore({ session, look, save: saveAccountPreferences }),
  );
  const { nativeMode, setMode } = useMode();

  // Layout effects run after hydration but before paint, so the browser's
  // saved copy replaces the server's view without a visible frame between.
  useLayoutEffect(
    () => store.bindMode(nativeMode, setMode),
    [store, nativeMode, setMode],
  );
  useLayoutEffect(() => store.start(), [store]);
  useLayoutEffect(
    () => store.setHost(session, saveAccountPreferences),
    [store, session, saveAccountPreferences],
  );

  return (
    <PreferencesContext.Provider value={store}>
      {children}
    </PreferencesContext.Provider>
  );
}

/**
 * Fixed preferences for a subtree: previews, stories and tests. Nothing is
 * read from or written to the browser, and changes are refused.
 */
export function StaticPreferences({
  settings,
  deviceTimeZone = null,
  children,
}: {
  settings?: SettingsPatch;
  /** The zone `system` stands for while rendering on the server. */
  deviceTimeZone?: string | null;
  children: ReactNode;
}) {
  const key = JSON.stringify(settings ?? null);
  const store = useMemo(
    () =>
      createStaticStore(
        mergeSettings(settingsDefaults, JSON.parse(key) ?? {}),
        deviceTimeZone,
      ),
    [key, deviceTimeZone],
  );
  return (
    <PreferencesContext.Provider value={store}>
      {children}
    </PreferencesContext.Provider>
  );
}

/**
 * A slice of the preferences snapshot. The selector must return a value that
 * keeps its identity while unchanged (a section, a field), so only the
 * subscribers of what changed re-render.
 */
export function usePreferences<T>(select: (s: PreferencesSnapshot) => T): T {
  const store = useContext(PreferencesContext);
  return useSyncExternalStore(
    store.subscribe,
    () => select(store.getSnapshot()),
    () => select(store.getServerSnapshot()),
  );
}

/** The changes the runtime accepts. Stable for the life of the provider. */
export function usePreferenceActions() {
  const store = useContext(PreferencesContext);
  return useMemo(
    () => ({
      update: store.update,
      setDisplayOnAllDevices: store.setDisplayOnAllDevices,
      retryAccountSave: store.retryAccountSave,
    }),
    [store],
  );
}

export const useRegionalPreferences = () =>
  usePreferences((s) => s.settings.regional);
export const useThemePreferences = () =>
  usePreferences((s) => s.settings.theme);
export const useAppearancePreferences = () =>
  usePreferences((s) => s.settings.appearance);
export const useNotificationPreferences = () =>
  usePreferences((s) => s.settings.notifications);
export const usePrivacyPreferences = () =>
  usePreferences((s) => s.settings.privacy);

/**
 * How dates and times are written for this person. On the server and during
 * hydration `system` means the account's last device zone, so server and
 * browser write the same text; after that it means this browser's zone.
 */
export function useDateTimeFormatting(): DateTimeFormatting {
  const regional = useRegionalPreferences();
  const timeZone = usePreferences((s) => s.timeZone);
  return useMemo(
    () => resolveDateTimeFormatting(regional, timeZone),
    [regional, timeZone],
  );
}

/** The number format this person chose, for `formatNumber`. */
export function useNumberFormat(): RegionalSettings['numberFormat'] {
  return usePreferences((s) => s.settings.regional.numberFormat);
}

/**
 * Whether a collector may run. False until this browser's saved choice is
 * known, and false outside a `PreferencesProvider`: nothing is collected on a
 * guess.
 */
export function useCanCollect(purpose: PrivacyPurpose): boolean {
  const privacy = usePrivacyPreferences();
  const ready = usePreferences((s) => s.phase === 'ready');
  const globalPrivacyControl = useGlobalPrivacyControl();
  return useMemo(
    () => ready && canCollect(privacy, purpose, { globalPrivacyControl }),
    [ready, privacy, purpose, globalPrivacyControl],
  );
}
