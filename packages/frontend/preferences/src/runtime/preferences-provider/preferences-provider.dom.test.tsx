import { act, render, renderHook, waitFor } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { useEffect, type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  LOOK_COOKIE_NAME,
  pageLanguage,
  PRIVACY_POLICY_VERSIONS,
  readAccountPreferences,
  regionalDefaults,
  settingsDefaults,
  type PreferencesSession,
  type SavePreferencesResult,
} from '@synapcity/domain-preferences';
import { ModeProvider } from '../../providers';
import {
  PREFERENCES_OWNER_KEY,
  readLookCookie,
  writeDeviceDisplay,
  writeLookCookie,
  writeStoredPreferences,
} from '../../store';
import type { SaveAccountPreferences } from '../preferences-store';
import {
  PreferencesProvider,
  StaticPreferences,
  useCanCollect,
  useDateTimeFormatting,
  useNumberFormat,
  usePreferenceActions,
  usePreferences,
  useRegionalPreferences,
} from './preferences-provider';

const KEY = 'synapcity-preferences';
const browserZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
const guest: PreferencesSession = { kind: 'guest' };
const account = (
  preferences: unknown,
  userId = 'u1',
  deviceTimezone: string | null = browserZone,
): PreferencesSession => ({
  kind: 'account',
  userId,
  stored: {
    preferences:
      preferences === null ? null : readAccountPreferences(preferences),
    deviceTimezone,
  },
});
const granted = {
  granted: true,
  updatedAt: '2026-01-01T00:00:00.000Z',
  version: PRIVACY_POLICY_VERSIONS.errorReports,
  askAgain: false,
};
const owner = () => JSON.parse(localStorage.getItem(PREFERENCES_OWNER_KEY)!);
const stored = () => JSON.parse(localStorage.getItem(KEY)!);

function wrapper(
  session: PreferencesSession,
  save?: SaveAccountPreferences,
  look = null as ReturnType<typeof readLookCookie>,
) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <ModeProvider attribute="class" defaultTheme="system" enableSystem>
        <PreferencesProvider
          session={session}
          look={look}
          saveAccountPreferences={save}
        >
          {children}
        </PreferencesProvider>
      </ModeProvider>
    );
  };
}

function useRuntime() {
  return {
    snapshot: usePreferences((s) => s),
    actions: usePreferenceActions(),
  };
}

const clearCookie = () => {
  document.cookie = `${LOOK_COOKIE_NAME}=; Path=/; Max-Age=0`;
};
beforeEach(() => {
  localStorage.clear();
  clearCookie();
  document.documentElement.removeAttribute('lang');
  for (const key of Object.keys(document.documentElement.dataset)) {
    delete document.documentElement.dataset[key];
  }
});
afterEach(() => {
  vi.restoreAllMocks();
  Reflect.deleteProperty(navigator, 'globalPrivacyControl');
});

describe('without a runtime', () => {
  it('formats with the defaults and this browser zone', () => {
    const { result } = renderHook(() => useDateTimeFormatting());
    expect(result.current).toEqual({
      locale: 'en',
      timeZone: browserZone,
      hourCycle: 'h12',
      dateFormat: 'MM/DD/YYYY',
      weekStartsOn: 0,
    });
    expect(renderHook(() => useNumberFormat()).result.current).toBe(
      regionalDefaults.numberFormat,
    );
  });

  it('never allows collection, whatever the browser holds', () => {
    writeStoredPreferences(
      JSON.stringify({ privacy: { errorReports: granted } }),
    );
    expect(renderHook(() => useCanCollect('errorReports')).result.current).toBe(
      false,
    );
  });

  it('gives previews fixed values, and the device zone only to the server', () => {
    const regional = { timeFormat: '24-hour', timezone: 'system' } as const;
    const Static = ({ children }: { children: ReactNode }) => (
      <StaticPreferences
        settings={{ regional: { ...regional, numberFormat: '1.000,00' } }}
        deviceTimeZone="Asia/Tokyo"
      >
        {children}
      </StaticPreferences>
    );
    const { result } = renderHook(
      () => [useDateTimeFormatting(), useNumberFormat()] as const,
      { wrapper: Static },
    );
    expect(result.current[0]).toMatchObject({
      hourCycle: 'h23',
      timeZone: browserZone,
    });
    expect(result.current[1]).toBe('1.000,00');
    function Zone() {
      return <>{useDateTimeFormatting().timeZone}</>;
    }
    expect(
      renderToString(
        <Static>
          <Zone />
        </Static>,
      ),
    ).toBe('Asia/Tokyo');
  });
});

describe('PreferencesProvider on the server', () => {
  it('renders the account and its last device zone, never browser storage', () => {
    writeStoredPreferences(
      JSON.stringify({ regional: { timezone: 'Europe/Paris' } }),
    );
    function Probe() {
      const { timeZone, hourCycle } = useDateTimeFormatting();
      return <>{`${timeZone} ${hourCycle} ${useNumberFormat()}`}</>;
    }
    const Wrapper = wrapper(
      account(
        {
          regional: {
            timeFormat: '24-hour',
            timezone: 'system',
            numberFormat: '1.000,00',
          },
        },
        'u1',
        'Asia/Tokyo',
      ),
    );
    expect(
      renderToString(
        <Wrapper>
          <Probe />
        </Wrapper>,
      ),
    ).toContain('Asia/Tokyo h23 1.000,00');
  });

  it('holds no consent until the browser has loaded', () => {
    function Probe() {
      return <>{String(useCanCollect('errorReports'))}</>;
    }
    const Wrapper = wrapper(account({ privacy: { errorReports: granted } }));
    expect(
      renderToString(
        <Wrapper>
          <Probe />
        </Wrapper>,
      ),
    ).toMatch(/false$/);
  });
});

describe('PreferencesProvider in the browser', () => {
  it('applies a legacy guest copy without rewriting it', async () => {
    const legacy = JSON.stringify({
      regional: { language: 'fr', timezone: 'Europe/Paris' },
      appearance: { showBorders: true },
    });
    writeStoredPreferences(legacy);
    const { result } = renderHook(() => useRuntime(), {
      wrapper: wrapper(guest),
    });
    expect(result.current.snapshot.phase).toBe('ready');
    expect(result.current.snapshot.settings.regional.timezone).toBe(
      'Europe/Paris',
    );
    expect(localStorage.getItem(KEY)).toBe(legacy);
    expect(localStorage.getItem(PREFERENCES_OWNER_KEY)).toBeNull();
    expect(document.documentElement.dataset.borders).toBe('true');
    expect(document.documentElement.lang).toBe(pageLanguage('fr'));
  });

  it('never treats consent from an unmarked legacy copy as this guest’s', () => {
    const legacy = JSON.stringify({
      regional: { language: 'fr' },
      privacy: { errorReports: granted },
    });
    writeStoredPreferences(legacy);

    const { result } = renderHook(
      () => ({
        allowed: useCanCollect('errorReports'),
        privacy: usePreferences((state) => state.settings.privacy),
      }),
      { wrapper: wrapper(guest) },
    );

    expect(result.current.allowed).toBe(false);
    expect(result.current.privacy).toEqual(settingsDefaults.privacy);
    expect(localStorage.getItem(KEY)).toBe(legacy);
    expect(localStorage.getItem(PREFERENCES_OWNER_KEY)).toBeNull();
  });

  it('treats an unreadable document as no consent', () => {
    localStorage.setItem(KEY, '{not json');

    const { result } = renderHook(() => useCanCollect('errorReports'), {
      wrapper: wrapper(guest),
    });

    expect(result.current).toBe(false);
  });

  it('lets Global Privacy Control override a saved sharing grant', () => {
    Object.defineProperty(navigator, 'globalPrivacyControl', {
      configurable: true,
      value: true,
    });
    const sharing = {
      granted: true,
      updatedAt: '2026-01-01T00:00:00.000Z',
      version: PRIVACY_POLICY_VERSIONS.sharing,
      askAgain: false,
    };
    writeStoredPreferences(JSON.stringify({ privacy: { sharing } }));
    localStorage.setItem(
      PREFERENCES_OWNER_KEY,
      JSON.stringify({
        v: 1,
        owner: { kind: 'guest', adoptable: true },
      }),
    );

    const { result } = renderHook(() => useCanCollect('sharing'), {
      wrapper: wrapper(guest),
    });

    expect(result.current).toBe(false);
  });

  it('uses the validated look cookie for device settings when storage is empty', () => {
    writeLookCookie({
      v: 1,
      theme: {
        ...settingsDefaults.theme,
        density: 'compact',
        textSize: 110,
      },
      appearance: {
        ...settingsDefaults.appearance,
        contrastMode: 'high',
      },
    });

    const { result } = renderHook(() => useRuntime(), {
      wrapper: wrapper(
        account({ regional: { language: 'de' } }),
        undefined,
        readLookCookie(),
      ),
    });

    expect(result.current.snapshot.settings.theme.density).toBe('compact');
    expect(result.current.snapshot.settings.theme.textSize).toBe(110);
    expect(result.current.snapshot.settings.appearance.contrastMode).toBe(
      'high',
    );
    expect(result.current.snapshot.settings.regional.language).toBe('de');
  });

  it('reads the cookie as it is now, not as the request had it, after an in-place sign-out', async () => {
    const lookWith = (
      density: 'compact' | 'spacious',
      bodyFont: 'lora' | 'default',
    ) => ({
      v: 1 as const,
      theme: { ...settingsDefaults.theme, density, bodyFont },
      appearance: {
        animationsEnabled: true,
        reducedMotion: false,
        contrastMode: 'none' as const,
        showBorders: false,
      },
    });
    // The request carried the signed-in person's look; storage is empty.
    writeLookCookie(lookWith('compact', 'lora'));
    let session = account({ theme: { bodyFont: 'lora' } });
    const requestLook = readLookCookie();
    function Probe() {
      const { theme } = usePreferences((s) => s.settings);
      return <output>{`${theme.density} ${theme.bodyFont}`}</output>;
    }
    const App = () => (
      <ModeProvider attribute="class">
        <PreferencesProvider session={session} look={requestLook}>
          <Probe />
        </PreferencesProvider>
      </ModeProvider>
    );
    const view = render(<App />);
    expect(view.container.querySelector('output')!.textContent).toBe(
      'compact lora',
    );

    // Sign-out rewrote the cookie, and storage was cleared meanwhile.
    localStorage.clear();
    writeLookCookie(lookWith('spacious', 'default'));
    session = guest;
    view.rerender(<App />);
    await waitFor(() =>
      expect(view.container.querySelector('output')!.textContent).toBe(
        'spacious default',
      ),
    );
  });

  it('withholds "Saved" until the account write it depends on succeeds', async () => {
    let finish: (result: SavePreferencesResult) => void = () => {};
    const save = vi.fn<SaveAccountPreferences>(
      () => new Promise((resolve) => (finish = resolve)),
    );
    const { result } = renderHook(() => useRuntime(), {
      wrapper: wrapper(account({}), save),
    });
    act(() => {
      result.current.actions.update({ regional: { language: 'fr' } });
    });
    expect(result.current.snapshot.status.kind).toBe('account-save-pending');

    // A device-only change while the write runs is not reported as saved.
    act(() => {
      result.current.actions.update({ theme: { density: 'compact' } });
    });
    expect(result.current.snapshot.status.kind).toBe('account-save-pending');

    await act(async () => finish({ ok: true }));
    expect(result.current.snapshot.status.kind).toBe('saved');
  });

  it('keeps a signed-out failure and its wording through later device changes', async () => {
    const save = vi.fn<SaveAccountPreferences>(async () => ({
      ok: false,
      error: 'Sign in again.',
      signedOut: true,
    }));
    const { result } = renderHook(() => useRuntime(), {
      wrapper: wrapper(account({}), save),
    });
    act(() => {
      result.current.actions.update({ regional: { language: 'fr' } });
    });
    await waitFor(() =>
      expect(result.current.snapshot.accountFailure).toBe('signed-out'),
    );
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    act(() => {
      result.current.actions.update({ theme: { density: 'compact' } });
    });
    expect(result.current.snapshot.status.kind).toBe('storage-unavailable');
    expect(result.current.snapshot.accountFailure).toBe('signed-out');
    expect(result.current.snapshot.accountFailureMessage).toBe(
      'Sign in again.',
    );
    // Nothing more is sent for a session that has ended.
    act(() => {
      result.current.actions.update({ regional: { language: 'de' } });
      result.current.actions.retryAccountSave();
    });
    expect(save).toHaveBeenCalledOnce();
  });

  it('lets the account win over a stale copy, and caches it as that account’s', () => {
    writeStoredPreferences(
      JSON.stringify({
        regional: { language: 'fr' },
        theme: { density: 'compact' },
      }),
    );
    const { result } = renderHook(() => useRuntime(), {
      wrapper: wrapper(account({ regional: { language: 'de' } })),
    });
    expect(result.current.snapshot.settings.regional.language).toBe('de');
    expect(result.current.snapshot.settings.theme.density).toBe('compact');
    expect(stored().regional.language).toBe('de');
    expect(owner()).toEqual({ v: 1, owner: { kind: 'account', userId: 'u1' } });
    expect(readLookCookie()?.theme.density).toBe('compact');
  });

  it('adopts choices a guest made before signing in, once', async () => {
    const save = vi.fn<SaveAccountPreferences>(async () => ({ ok: true }));
    const { result: asGuest, unmount } = renderHook(() => useRuntime(), {
      wrapper: wrapper(guest),
    });
    act(() => {
      asGuest.current.actions.update({ regional: { language: 'fr' } });
    });
    unmount();
    expect(owner().owner).toEqual({ kind: 'guest', adoptable: true });

    renderHook(() => useRuntime(), { wrapper: wrapper(account(null), save) });
    await waitFor(() => expect(save).toHaveBeenCalledOnce());
    expect(save.mock.calls[0]![0].regional.language).toBe('fr');
  });

  it('adopts guest choices and reports the zone when sign-in updates the provider in place', async () => {
    const save = vi.fn<SaveAccountPreferences>(async () => ({ ok: true }));
    let session: PreferencesSession = guest;
    let saver: SaveAccountPreferences | undefined;
    let mounts = 0;

    function Probe() {
      const { snapshot, actions } = useRuntime();
      // Counts mounts: a remount would reset this subtree and the runtime.
      useEffect(() => {
        mounts++;
      }, []);
      return (
        <button
          onClick={() => actions.update({ regional: { language: 'fr' } })}
        >
          {snapshot.settings.regional.language}
        </button>
      );
    }
    function App() {
      return (
        <ModeProvider attribute="class" defaultTheme="system" enableSystem>
          <PreferencesProvider session={session} saveAccountPreferences={saver}>
            <Probe />
          </PreferencesProvider>
        </ModeProvider>
      );
    }

    const view = render(<App />);
    act(() => view.getByRole('button').click());
    expect(owner().owner).toEqual({ kind: 'guest', adoptable: true });

    session = account(null, 'u1', 'Pacific/Chatham');
    saver = save;
    view.rerender(<App />);

    await waitFor(() => expect(save).toHaveBeenCalledOnce());
    expect(save.mock.calls[0]![0].regional.language).toBe('fr');
    // The current device zone, not the account's stale one.
    expect(save.mock.calls[0]![1]).toBe(browserZone);
    // Exactly once: nothing else is sent once the adoption has settled.
    await act(async () => new Promise((resolve) => setTimeout(resolve)));
    expect(save).toHaveBeenCalledOnce();
    expect(mounts).toBe(1);
    expect(owner().owner).toEqual({ kind: 'account', userId: 'u1' });
  });

  it('never adopts a legacy copy', async () => {
    writeStoredPreferences(JSON.stringify({ regional: { language: 'fr' } }));
    const save = vi.fn<SaveAccountPreferences>(async () => ({ ok: true }));
    const { result } = renderHook(() => useRuntime(), {
      wrapper: wrapper(account(null), save),
    });
    expect(result.current.snapshot.settings.regional.language).toBe('en');
    await new Promise((resolve) => setTimeout(resolve));
    expect(save).not.toHaveBeenCalled();
  });

  it('isolates people across sign-in, account switch and sign-out without remounting', async () => {
    const save = vi.fn<SaveAccountPreferences>(async () => ({ ok: true }));
    let session = account({ regional: { language: 'de' } });
    function Probe() {
      return (
        <span data-testid="language">{useRegionalPreferences().language}</span>
      );
    }
    function App() {
      return (
        <ModeProvider attribute="class" defaultTheme="system" enableSystem>
          <PreferencesProvider session={session} saveAccountPreferences={save}>
            <Probe />
          </PreferencesProvider>
        </ModeProvider>
      );
    }
    const view = render(<App />);
    expect(view.getByTestId('language').textContent).toBe('de');

    session = account(null, 'u2');
    view.rerender(<App />);
    await waitFor(() =>
      expect(view.getByTestId('language').textContent).toBe('en'),
    );
    expect(owner().owner).toEqual({ kind: 'account', userId: 'u2' });

    session = guest;
    view.rerender(<App />);
    await waitFor(() => expect(owner().owner.kind).toBe('guest'));
    expect(stored().regional.language).toBe('en');
    expect(save).not.toHaveBeenCalled();
  });

  it('sends one save at a time, the newest last, and reports only its outcome', async () => {
    const pending: ((result: SavePreferencesResult) => void)[] = [];
    const save = vi.fn<SaveAccountPreferences>(
      () => new Promise((resolve) => pending.push(resolve)),
    );
    const { result } = renderHook(() => useRuntime(), {
      wrapper: wrapper(account({}), save),
    });
    act(() => {
      result.current.actions.update({ regional: { language: 'fr' } });
      result.current.actions.update({ regional: { language: 'de' } });
      result.current.actions.update({ regional: { language: 'es' } });
    });
    expect(save).toHaveBeenCalledOnce();
    expect(result.current.snapshot.accountSave).toBe('saving');

    await act(async () => pending[0]!({ ok: false, error: 'x' }));
    // The failure is superseded by the newest change, which goes next.
    expect(save).toHaveBeenCalledTimes(2);
    expect(save.mock.calls[1]![0].regional.language).toBe('es');
    expect(result.current.snapshot.status.kind).toBe('account-save-pending');

    await act(async () =>
      pending[1]!({ ok: false, error: 'Sign in again.', signedOut: true }),
    );
    expect(result.current.snapshot.status).toEqual({
      kind: 'account-save-failed',
      message: 'Sign in again.',
      signedOut: true,
    });
    expect(result.current.snapshot.settings.regional.language).toBe('es');
  });

  it('retries a failed save when the browser comes back online', async () => {
    const save = vi
      .fn<SaveAccountPreferences>()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue({ ok: true });
    const { result } = renderHook(() => useRuntime(), {
      wrapper: wrapper(account({}), save),
    });
    act(() => {
      result.current.actions.update({ regional: { language: 'fr' } });
    });
    await waitFor(() =>
      expect(result.current.snapshot.accountSave).toBe('failed'),
    );
    act(() => {
      window.dispatchEvent(new Event('online'));
    });
    await waitFor(() =>
      expect(result.current.snapshot.accountSave).toBe('idle'),
    );
    expect(save).toHaveBeenCalledTimes(2);
  });

  it('keeps a retryable failure visible through device-only changes', async () => {
    const save = vi
      .fn<SaveAccountPreferences>()
      .mockResolvedValue({ ok: false, error: 'offline' });
    const { result } = renderHook(() => useRuntime(), {
      wrapper: wrapper(account({}), save),
    });
    act(() => {
      result.current.actions.update({ regional: { language: 'fr' } });
    });
    await waitFor(() =>
      expect(result.current.snapshot.accountFailure).toBe('retryable'),
    );

    act(() => {
      result.current.actions.update({ theme: { density: 'compact' } });
    });

    expect(result.current.snapshot.status.kind).toBe('account-save-failed');
    expect(result.current.snapshot.accountFailure).toBe('retryable');
  });

  it('does not retry a signed-out failure when the browser comes online', async () => {
    const save = vi.fn<SaveAccountPreferences>().mockResolvedValue({
      ok: false,
      error: 'Sign in again.',
      signedOut: true,
    });
    const { result } = renderHook(() => useRuntime(), {
      wrapper: wrapper(account({}), save),
    });
    act(() => {
      result.current.actions.update({ regional: { language: 'fr' } });
    });
    await waitFor(() =>
      expect(result.current.snapshot.accountFailure).toBe('signed-out'),
    );

    act(() => window.dispatchEvent(new Event('online')));
    await new Promise((resolve) => setTimeout(resolve));

    expect(save).toHaveBeenCalledOnce();
  });

  it('ignores the outcome of a save made for someone no longer signed in', async () => {
    let finish: (result: SavePreferencesResult) => void = () => {};
    const save = vi.fn<SaveAccountPreferences>(
      () => new Promise((resolve) => (finish = resolve)),
    );
    let session = account({});
    function Probe() {
      const { snapshot, actions } = useRuntime();
      return (
        <button
          onClick={() => actions.update({ regional: { language: 'fr' } })}
        >
          {snapshot.status.kind}
        </button>
      );
    }
    const App = () => (
      <ModeProvider attribute="class">
        <PreferencesProvider session={session} saveAccountPreferences={save}>
          <Probe />
        </PreferencesProvider>
      </ModeProvider>
    );
    const view = render(<App />);
    act(() => view.getByRole('button').click());
    session = guest;
    view.rerender(<App />);
    await act(async () => finish({ ok: false, error: 'x' }));
    expect(view.getByRole('button').textContent).toBe('idle');
  });

  it('drains the newest queued account change in order when sign-out arrives', async () => {
    const pending: ((result: SavePreferencesResult) => void)[] = [];
    const save = vi.fn<SaveAccountPreferences>(
      () => new Promise((resolve) => pending.push(resolve)),
    );
    let session: PreferencesSession = account({});
    let saver: SaveAccountPreferences | undefined = save;
    function Probe() {
      const { snapshot, actions } = useRuntime();
      return (
        <>
          <button
            onClick={() => {
              actions.update({ regional: { language: 'fr' } });
              actions.update({ regional: { language: 'de' } });
            }}
          >
            Change twice
          </button>
          <output>
            {`${snapshot.accountSave} ${snapshot.accountFailure} ${snapshot.status.kind} ${snapshot.settings.regional.language}`}
          </output>
        </>
      );
    }
    function App() {
      return (
        <ModeProvider attribute="class">
          <PreferencesProvider session={session} saveAccountPreferences={saver}>
            <Probe />
          </PreferencesProvider>
        </ModeProvider>
      );
    }
    const view = render(<App />);
    act(() => view.getByRole('button').click());
    expect(save).toHaveBeenCalledOnce();

    session = guest;
    saver = undefined;
    view.rerender(<App />);
    await act(async () => pending[0]!({ ok: true }));

    await waitFor(() => expect(save).toHaveBeenCalledTimes(2));
    expect(save.mock.calls[1]![0].regional.language).toBe('de');
    await act(async () =>
      pending[1]!({
        ok: false,
        error: 'Sign in again.',
        signedOut: true,
      }),
    );
    // Neither the first outcome nor the drained one reaches the guest.
    expect(view.container.querySelector('output')!.textContent).toBe(
      'idle none idle en',
    );
    expect(save).toHaveBeenCalledTimes(2);
  });

  it('takes up another tab’s save only from the same person', () => {
    const { result } = renderHook(() => useCanCollect('errorReports'), {
      wrapper: wrapper(guest),
    });
    expect(result.current).toBe(false);
    act(() => {
      writeStoredPreferences(
        JSON.stringify({ privacy: { errorReports: granted } }),
      );
      localStorage.setItem(
        PREFERENCES_OWNER_KEY,
        JSON.stringify({
          v: 1,
          owner: { kind: 'guest', adoptable: true },
        }),
      );
      window.dispatchEvent(new StorageEvent('storage', { key: KEY }));
    });
    expect(result.current).toBe(true);

    act(() => {
      writeStoredPreferences(JSON.stringify({ privacy: {} }));
      localStorage.setItem(
        PREFERENCES_OWNER_KEY,
        JSON.stringify({ v: 1, owner: { kind: 'account', userId: 'u9' } }),
      );
      window.dispatchEvent(new StorageEvent('storage', { key: KEY }));
    });
    expect(result.current).toBe(true);
  });

  it('does not honour consent arriving later from an unmarked document', () => {
    const { result } = renderHook(() => useCanCollect('errorReports'), {
      wrapper: wrapper(guest),
    });

    act(() => {
      writeStoredPreferences(
        JSON.stringify({ privacy: { errorReports: granted } }),
      );
      window.dispatchEvent(new StorageEvent('storage', { key: KEY }));
    });

    expect(result.current).toBe(false);
  });

  it('lets consent consumers follow live edits in this tab', () => {
    const { result } = renderHook(
      () => ({
        allowed: useCanCollect('errorReports'),
        actions: usePreferenceActions(),
      }),
      { wrapper: wrapper(guest) },
    );
    expect(result.current.allowed).toBe(false);

    act(() => {
      result.current.actions.update({
        privacy: { errorReports: granted },
      });
    });

    expect(result.current.allowed).toBe(true);
  });

  it('takes up another tab’s display override state for the same account', () => {
    const { result } = renderHook(() => useRuntime(), {
      wrapper: wrapper(account({})),
    });
    const sameAccount = JSON.stringify({
      v: 1,
      owner: { kind: 'account', userId: 'u1' },
    });

    act(() => {
      writeStoredPreferences(
        JSON.stringify({ appearance: { contrastMode: 'high' } }),
      );
      localStorage.setItem(PREFERENCES_OWNER_KEY, sameAccount);
      writeDeviceDisplay(settingsDefaults.appearance);
      window.dispatchEvent(new StorageEvent('storage', { key: KEY }));
    });
    expect(result.current.snapshot.displayOnAllDevices).toBe(true);
    expect(result.current.snapshot.settings.appearance.contrastMode).toBe(
      'high',
    );

    act(() => {
      writeStoredPreferences(
        JSON.stringify({ appearance: { contrastMode: 'none' } }),
      );
      writeDeviceDisplay(null);
      window.dispatchEvent(new StorageEvent('storage', { key: KEY }));
    });
    expect(result.current.snapshot.displayOnAllDevices).toBe(false);
  });

  it('re-renders a category subscriber only when its category changes', () => {
    let renders = 0;
    function Regional() {
      renders++;
      useRegionalPreferences();
      return null;
    }
    const { result } = renderHook(() => usePreferenceActions(), {
      wrapper: ({ children }) => {
        const Wrapper = wrapper(guest);
        return (
          <Wrapper>
            <Regional />
            {children}
          </Wrapper>
        );
      },
    });
    const before = renders;
    act(() => {
      result.current.update({ theme: { density: 'compact' } });
    });
    expect(renders).toBe(before);
    act(() => {
      result.current.update({ regional: { language: 'fr' } });
    });
    expect(renders).toBe(before + 1);
  });

  it('applies the display override and restores this device’s own values when it is turned off', async () => {
    const save = vi.fn<SaveAccountPreferences>(async () => ({ ok: true }));
    writeStoredPreferences(
      JSON.stringify({ appearance: { showBorders: true } }),
    );
    const { result } = renderHook(() => useRuntime(), {
      wrapper: wrapper(
        account({
          appearanceOverride: {
            ...settingsDefaults.appearance,
            colorScheme: undefined,
            contrastMode: 'high',
          },
        }),
        save,
      ),
    });
    expect(result.current.snapshot.displayOnAllDevices).toBe(true);
    expect(result.current.snapshot.settings.appearance.contrastMode).toBe(
      'high',
    );
    expect(result.current.snapshot.settings.appearance.showBorders).toBe(false);

    act(() => result.current.actions.setDisplayOnAllDevices(false));
    expect(result.current.snapshot.displayOnAllDevices).toBe(false);
    expect(result.current.snapshot.settings.appearance.showBorders).toBe(true);
    await waitFor(() => expect(save).toHaveBeenCalled());
    expect(save.mock.lastCall![0].appearanceOverride).toBeUndefined();
  });

  it('keeps working for the visit when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const { result } = renderHook(() => useRuntime(), {
      wrapper: wrapper(guest),
    });
    expect(result.current.snapshot.status).toEqual({
      kind: 'storage-unavailable',
      during: 'load',
    });
    act(() => {
      result.current.actions.update({ theme: { density: 'compact' } });
    });
    expect(result.current.snapshot.settings.theme.density).toBe('compact');
    expect(result.current.snapshot.status).toEqual({
      kind: 'storage-unavailable',
      during: 'write',
    });
    expect(readLookCookie()?.theme.density).toBe('compact');
  });

  it('still applies and shares the account look when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    const { result } = renderHook(() => useRuntime(), {
      wrapper: wrapper(account({ theme: { bodyFont: 'lora' } })),
    });

    expect(result.current.snapshot.settings.theme.bodyFont).toBe('lora');
    expect(
      document.documentElement.style.getPropertyValue('--font-preference-body'),
    ).not.toBe('');
    expect(readLookCookie()?.theme.bodyFont).toBe('lora');
  });
});
