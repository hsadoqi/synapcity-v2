import { act, render, renderHook, waitFor } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { useRef, type ReactNode } from 'react';
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
};
const owner = () => JSON.parse(localStorage.getItem(PREFERENCES_OWNER_KEY)!);
const stored = () => JSON.parse(localStorage.getItem(KEY)!);

function wrapper(session: PreferencesSession, save?: SaveAccountPreferences) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <ModeProvider attribute="class" defaultTheme="system" enableSystem>
        <PreferencesProvider session={session} saveAccountPreferences={save}>
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
afterEach(() => vi.restoreAllMocks());

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
      const renders = useRef(0);
      renders.current++;
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
    expect(result.current.snapshot.status.kind).toBe('saved');

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

  it('takes up another tab’s save only from the same person', () => {
    const { result } = renderHook(() => useCanCollect('errorReports'), {
      wrapper: wrapper(guest),
    });
    expect(result.current).toBe(false);
    act(() => {
      writeStoredPreferences(
        JSON.stringify({ privacy: { errorReports: granted } }),
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
});
