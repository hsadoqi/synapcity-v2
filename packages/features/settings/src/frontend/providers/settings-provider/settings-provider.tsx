'use client';

import {
  createContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  usePreferenceActions,
  usePreferences,
  type PreferencesStatus,
} from '@synapcity/frontend-preferences';
import type { Settings, SettingsPatch } from '@synapcity/domain-preferences';

const NOT_SAVED_TO_ACCOUNT =
  'Changes apply on this device, but could not be saved to your account.';

/** How the Settings page words what the preferences runtime reports. */
export function statusMessage(status: PreferencesStatus): string {
  switch (status.kind) {
    case 'idle':
      return '';
    case 'saved':
      return 'Saved';
    case 'not-ready':
      return 'Preferences are still loading. Please try again.';
    case 'invalid-update':
      return 'Preferences could not be updated. Check the selected values.';
    case 'stored-unreadable':
      return 'Saved preferences could not be loaded. Defaults are in use.';
    case 'account-save-pending':
      return 'Saving to your account…';
    case 'storage-unavailable':
      return status.during === 'load'
        ? 'Storage unavailable. Changes apply for this visit.'
        : 'Changes applied. Browser storage is unavailable.';
    case 'account-save-failed':
      return status.message || NOT_SAVED_TO_ACCOUNT;
  }
}

/** Reports that still describe the present, whenever they were made. */
const lasting = (status: PreferencesStatus) =>
  status.kind === 'stored-unreadable' ||
  (status.kind === 'storage-unavailable' && status.during === 'load') ||
  status.kind === 'account-save-failed';

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
  /**
   * Whether the last account save failed in a way trying again can fix. A
   * sign-out is not one: its message asks the person to sign in instead.
   */
  canRetryAccountSave: boolean;
  /** A retry is running; keep its control mounted and disabled until it settles. */
  isRetryingAccountSave: boolean;
  retryAccountSave: () => void;
  draftScope?: string;
};

export const SettingsContext = createContext<SettingsContextType | null>(null);

/**
 * The Settings page's view of the preferences runtime (`PreferencesProvider`
 * in `@synapcity/frontend-preferences`, mounted by the host at its root). The
 * runtime owns the values, storage, the account and the document; this adds
 * what only the page needs: the greeting name, the draft scope, and the status
 * line's wording and timing.
 */
export function SettingsProvider({
  children,
  name: initialName = null,
  draftScope,
}: {
  children: ReactNode;
  name?: string | null;
  /** Host identity used to keep per-person drafts separate in this tab. */
  draftScope?: string;
}) {
  const settings = usePreferences((s) => s.settings);
  const isReady = usePreferences((s) => s.phase === 'ready');
  const sync = usePreferences((s) => s.sync);
  const displayOnAllDevices = usePreferences((s) => s.displayOnAllDevices);
  const reported = usePreferences((s) => s.status);
  const statusId = usePreferences((s) => s.statusId);
  const accountSave = usePreferences((s) => s.accountSave);
  const accountFailure = usePreferences((s) => s.accountFailure);
  const accountFailureMessage = usePreferences((s) => s.accountFailureMessage);
  const {
    update: updateSettings,
    setDisplayOnAllDevices,
    retryAccountSave,
  } = usePreferenceActions();

  const [name, updateName] = useState(initialName);
  // The page re-renders with the saved name after a profile edit. Follow it,
  // instead of keeping the name the page first loaded with. This is the
  // supported way to derive state from a changed prop without an effect.
  const [loadedName, setLoadedName] = useState(initialName);
  if (loadedName !== initialName) {
    setLoadedName(initialName);
    updateName(initialName);
  }

  // Reports from before this page opened are old news, unless they still hold.
  const [openedAt] = useState(statusId);
  const [clearedId, setClearedId] = useState(-1);
  const fresh = statusId > openedAt || lasting(reported);
  const latest = fresh && statusId !== clearedId ? statusMessage(reported) : '';
  // An unresolved account failure stays in the line whatever is reported
  // after it (a device-only change, blocked storage), until a save resolves
  // it or the session changes. While a retry runs, the pending report says so.
  const failure =
    accountFailure !== 'none' && accountSave !== 'saving'
      ? accountFailureMessage || NOT_SAVED_TO_ACCOUNT
      : '';
  const status =
    !failure || latest === failure
      ? latest
      : [latest, failure].filter(Boolean).join(' ');

  useEffect(() => {
    if (reported.kind !== 'saved') return;
    const timer = setTimeout(() => setClearedId(statusId), 3000);
    return () => clearTimeout(timer);
  }, [reported, statusId]);

  const syncsToAccount = sync === 'synced';
  const canRetryAccountSave = accountFailure === 'retryable';
  const isRetryingAccountSave = canRetryAccountSave && accountSave === 'saving';
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
      canRetryAccountSave,
      isRetryingAccountSave,
      retryAccountSave,
      draftScope,
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
      canRetryAccountSave,
      isRetryingAccountSave,
      retryAccountSave,
      draftScope,
    ],
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}
