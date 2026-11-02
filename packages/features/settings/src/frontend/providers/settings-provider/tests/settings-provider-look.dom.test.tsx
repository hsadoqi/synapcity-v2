import { StrictMode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  LOOK_COOKIE_NAME,
  lookOf,
  settingsDefaults,
} from '@synapcity/domain-preferences';
import { ModeProvider, readLookCookie } from '@synapcity/frontend-preferences';
import { SettingsProvider } from '..';
import { useAppearanceSettings } from '../../../hooks/use-visuals/use-appearance-settings';
import { useRegionalSettings } from '../../../hooks/use-regional-settings';
import { useSettings } from '../../../hooks/use-settings-lifecycle/use-settings';
import { SettingsHeader } from '../../../components/shared/settings-page/settings-header';
import { stubBrowser } from '../../../testing';

function Controls() {
  const { settings, isReady } = useSettings();
  const { updateAppearance } = useAppearanceSettings();
  const { updateRegional } = useRegionalSettings();
  return (
    <>
      <span data-testid="ready">{String(isReady)}</span>
      <span data-testid="mode">{settings.theme.mode}</span>
      <button onClick={() => updateAppearance({ contrastMode: 'high' })}>
        High contrast
      </button>
      <button onClick={() => updateRegional({ language: 'fr' })}>French</button>
    </>
  );
}

function mount() {
  return render(
    <StrictMode>
      <ModeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        shareLook
      >
        <SettingsProvider name="Ada">
          <SettingsHeader />
          <Controls />
        </SettingsProvider>
      </ModeProvider>
    </StrictMode>,
  );
}
const ready = () =>
  waitFor(() => expect(screen.getByTestId('ready').textContent).toBe('true'));

beforeEach(() => {
  stubBrowser();
  document.cookie = `${LOOK_COOKIE_NAME}=; Path=/; Max-Age=0`;
  document.documentElement.className = '';
});

afterEach(() => vi.restoreAllMocks());

describe('SettingsProvider and the shared look', () => {
  it('writes the cookie when a look field is saved, and only the look', async () => {
    mount();
    await ready();
    fireEvent.click(screen.getByText('High contrast'));
    expect(readLookCookie()?.appearance.contrastMode).toBe('high');
    fireEvent.click(screen.getByText('French'));
    expect(decodeURIComponent(document.cookie)).not.toContain('fr');
  });

  it('does not report storage unavailable when only the cookie write fails', async () => {
    mount();
    await ready();
    vi.spyOn(document, 'cookie', 'set').mockImplementation(() => {
      throw new Error('blocked');
    });
    fireEvent.click(screen.getByText('High contrast'));
    expect(screen.getByRole('status').textContent).toBe('Saved');
  });

  it('still saves the shared look when localStorage is unavailable', async () => {
    mount();
    await ready();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    fireEvent.click(screen.getByText('High contrast'));

    expect(readLookCookie()?.appearance.contrastMode).toBe('high');
    expect(screen.getByRole('status').textContent).toBe(
      'Changes applied. Browser storage is unavailable.',
    );
  });

  it('keeps a mode chosen elsewhere', async () => {
    // As the boot script leaves it: the cookie and next-themes' entry say dark,
    // the saved document still says light.
    const look = lookOf(settingsDefaults);
    document.cookie = `${LOOK_COOKIE_NAME}=${encodeURIComponent(JSON.stringify({ ...look, theme: { ...look.theme, mode: 'dark' } }))}; Path=/`;
    localStorage.setItem('theme', 'dark');
    localStorage.setItem(
      'synapcity-preferences',
      JSON.stringify({
        ...settingsDefaults,
        theme: { ...settingsDefaults.theme, mode: 'light' },
      }),
    );
    mount();
    await ready();
    await waitFor(() =>
      expect(screen.getByTestId('mode').textContent).toBe('dark'),
    );
    expect(readLookCookie()?.theme.mode).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
