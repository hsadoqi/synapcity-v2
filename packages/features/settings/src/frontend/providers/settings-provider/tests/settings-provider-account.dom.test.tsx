import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ModeProvider } from '@synapcity/frontend-preferences';

import { AppearanceSettings } from '../../../components/appearance-settings';
import { useSettings } from '../../../hooks/use-settings';
import type { StoredAccountPreferences } from '@synapcity/domain-preferences';
import type { AccountSync, SavePreferencesResult } from '../../../../contracts';
import {
  accountPart,
  type DisplaySettings,
} from '@synapcity/domain-preferences';
import { currentSettings, saveTab, stubBrowser } from '../../../testing';
import { settingsDefaults, type Settings } from '@synapcity/domain-preferences';
import { SettingsProvider } from '..';

const KEY = 'synapcity-preferences';
const SET_ASIDE_KEY = 'synapcity-device-display';
const DEVICE_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone;

const display = (
  overrides: Partial<DisplaySettings> = {},
): DisplaySettings => ({
  animationsEnabled: true,
  reducedMotion: false,
  contrastMode: 'none',
  showBorders: false,
  ...overrides,
});

const withLanguage = (
  language: Settings['regional']['language'],
): Settings => ({
  ...settingsDefaults,
  regional: { ...settingsDefaults.regional, language },
});

beforeEach(stubBrowser);
afterEach(() => vi.unstubAllGlobals());

function Status() {
  const { status, isReady, updateSettings } = useSettings();
  return (
    <>
      <span data-testid="ready">{String(isReady)}</span>
      <span role="status" aria-label="Provider status">
        {status}
      </span>
      <button onClick={() => updateSettings({ regional: { language: 'ja' } })}>
        Change language
      </button>
    </>
  );
}

function sync(
  stored: Partial<StoredAccountPreferences> = {},
  result: SavePreferencesResult = { ok: true },
) {
  const save = vi.fn<AccountSync['save']>().mockResolvedValue(result);
  const account: AccountSync = {
    stored: { preferences: null, deviceTimezone: DEVICE_TZ, ...stored },
    save,
  };
  return { account, save };
}

async function mount(account?: AccountSync) {
  const result = render(
    <ModeProvider attribute="class" defaultTheme="system" enableSystem>
      <SettingsProvider account={account}>
        <AppearanceSettings />
        <Status />
        <SettingsRead />
      </SettingsProvider>
    </ModeProvider>,
  );
  await waitFor(() =>
    expect(screen.getByTestId('ready').textContent).toBe('true'),
  );
  return result;
}

function SettingsRead() {
  const { settings } = useSettings();
  return <span data-testid="settings">{JSON.stringify(settings)}</span>;
}

const stored = () => JSON.parse(localStorage.getItem(KEY)!);

describe('SettingsProvider with an account (ADR-0010)', () => {
  it('lets the account win over a stale copy in this browser, and caches it', async () => {
    localStorage.setItem(KEY, JSON.stringify(withLanguage('fr')));
    const { account, save } = sync({
      preferences: accountPart(withLanguage('de')),
    });
    await mount(account);
    expect(currentSettings().regional.language).toBe('de');
    expect(stored().regional.language).toBe('de');
    expect(save).not.toHaveBeenCalled();
  });

  it('keeps device settings from this browser when the account loads', async () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        ...settingsDefaults,
        appearance: { ...settingsDefaults.appearance, contrastMode: 'high' },
      }),
    );
    const { account } = sync({
      preferences: accountPart(withLanguage('de')),
    });
    await mount(account);
    expect(currentSettings().appearance.contrastMode).toBe('high');
  });

  it('saves choices made before signing in when the account has none', async () => {
    localStorage.setItem(KEY, JSON.stringify(withLanguage('es')));
    const { account, save } = sync();
    await mount(account);
    await waitFor(() =>
      expect(save).toHaveBeenCalledWith(
        accountPart(withLanguage('es')),
        DEVICE_TZ,
      ),
    );
  });

  it('saves nothing on load when there is nothing to adopt', async () => {
    const { account, save } = sync();
    await mount(account);
    expect(save).not.toHaveBeenCalled();
  });

  it('reports this device timezone when the account has another', async () => {
    const { account, save } = sync({
      preferences: accountPart(settingsDefaults),
      deviceTimezone: 'Pacific/Chatham',
    });
    await mount(account);
    await waitFor(() => expect(save).toHaveBeenCalledOnce());
    expect(save.mock.calls[0]![1]).toBe(DEVICE_TZ);
  });

  it('saves account changes, but not device-only changes', async () => {
    const { account, save } = sync({
      preferences: accountPart(settingsDefaults),
    });
    await mount(account);
    fireEvent.click(screen.getByText('Change language'));
    await waitFor(() => expect(save).toHaveBeenCalledOnce());
    expect(save.mock.calls[0]![0].regional.language).toBe('ja');

    fireEvent.click(
      screen.getByRole('switch', { name: 'Show component borders' }),
    );
    saveTab();
    expect(currentSettings().appearance.showBorders).toBe(true);
    expect(save).toHaveBeenCalledOnce();
  });

  it('keeps a change on this device and says so when the account save fails', async () => {
    const { account } = sync(
      { preferences: accountPart(settingsDefaults) },
      { ok: false, error: 'Could not save your changes. Try again.' },
    );
    await mount(account);
    fireEvent.click(screen.getByText('Change language'));
    await waitFor(() =>
      expect(
        screen.getByRole('status', { name: 'Provider status' }).textContent,
      ).toBe(
        'Changes apply on this device, but could not be saved to your account.',
      ),
    );
    expect(currentSettings().regional.language).toBe('ja');
    expect(stored().regional.language).toBe('ja');
  });

  it('passes on the sign-in message when the session has ended', async () => {
    const { account } = sync(
      { preferences: accountPart(settingsDefaults) },
      {
        ok: false,
        error: 'Sign in again to update your profile.',
        signedOut: true,
      },
    );
    await mount(account);
    fireEvent.click(screen.getByText('Change language'));
    await waitFor(() =>
      expect(
        screen.getByRole('status', { name: 'Provider status' }).textContent,
      ).toBe('Sign in again to update your profile.'),
    );
  });

  it('reports a save that throws as not saved to the account', async () => {
    const { account, save } = sync({
      preferences: accountPart(settingsDefaults),
    });
    save.mockRejectedValue(new Error('network'));
    await mount(account);
    fireEvent.click(screen.getByText('Change language'));
    await waitFor(() =>
      expect(
        screen.getByRole('status', { name: 'Provider status' }).textContent,
      ).toContain('could not be saved to your account'),
    );
  });
});

describe('display settings on all devices', () => {
  it('is offered only when signed in', async () => {
    await mount();
    expect(
      screen.queryByRole('switch', { name: 'Use on all my devices' }),
    ).toBeNull();
  });

  it('saves the display settings to the account, then follows later changes', async () => {
    const { account, save } = sync({
      preferences: accountPart(settingsDefaults),
    });
    await mount(account);
    const allDevices = screen.getByRole('switch', {
      name: 'Use on all my devices',
    });
    expect(allDevices.getAttribute('aria-checked')).toBe('false');

    fireEvent.click(allDevices);
    await waitFor(() => expect(save).toHaveBeenCalledOnce());
    expect(save.mock.calls[0]![0].appearanceOverride).toEqual(display());
    expect(JSON.parse(localStorage.getItem(SET_ASIDE_KEY)!)).toEqual(display());
    expect(allDevices.getAttribute('aria-checked')).toBe('true');

    fireEvent.click(
      screen.getByRole('switch', { name: 'Show component borders' }),
    );
    saveTab();
    await waitFor(() => expect(save).toHaveBeenCalledTimes(2));
    expect(save.mock.calls[1]![0].appearanceOverride).toEqual(
      display({ showBorders: true }),
    );
  });

  it("applies a saved override and restores this device's own values when it is turned off", async () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        ...settingsDefaults,
        appearance: { ...settingsDefaults.appearance, contrastMode: 'low' },
      }),
    );
    const { account, save } = sync({
      preferences: accountPart(
        settingsDefaults,
        display({ contrastMode: 'high' }),
      ),
    });
    await mount(account);
    expect(currentSettings().appearance.contrastMode).toBe('high');
    expect(stored().appearance.contrastMode).toBe('high');
    expect(JSON.parse(localStorage.getItem(SET_ASIDE_KEY)!).contrastMode).toBe(
      'low',
    );

    await act(async () => {
      fireEvent.click(
        screen.getByRole('switch', { name: 'Use on all my devices' }),
      );
    });
    expect(currentSettings().appearance.contrastMode).toBe('low');
    expect(stored().appearance.contrastMode).toBe('low');
    expect(localStorage.getItem(SET_ASIDE_KEY)).toBeNull();
    await waitFor(() => expect(save).toHaveBeenCalled());
    expect(save.mock.lastCall![0]).not.toHaveProperty('appearanceOverride');
  });

  it("restores this device's own values once the account drops the override", async () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        ...settingsDefaults,
        appearance: { ...settingsDefaults.appearance, contrastMode: 'high' },
      }),
    );
    localStorage.setItem(
      SET_ASIDE_KEY,
      JSON.stringify(display({ contrastMode: 'low' })),
    );
    const { account } = sync({ preferences: accountPart(settingsDefaults) });
    await mount(account);
    expect(currentSettings().appearance.contrastMode).toBe('low');
    expect(localStorage.getItem(SET_ASIDE_KEY)).toBeNull();
  });
});
