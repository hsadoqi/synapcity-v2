import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ModeProvider,
  PreferencesProvider,
  usePreferenceActions,
  type SaveAccountPreferences,
} from '@synapcity/frontend-preferences';
import { accountPart, settingsDefaults } from '@synapcity/domain-preferences';

import { stubBrowser } from '../../../../testing';
import { SettingsProvider } from '../../../../providers/settings-provider';
import { SettingsHeader } from '.';

beforeEach(stubBrowser);
afterEach(() => vi.unstubAllGlobals());

const show = (name?: string | null) =>
  render(
    <ModeProvider attribute="class" defaultTheme="system" enableSystem>
      <PreferencesProvider session={{ kind: 'guest' }}>
        <SettingsProvider name={name}>
          <SettingsHeader />
        </SettingsProvider>
      </PreferencesProvider>
    </ModeProvider>,
  );

describe('SettingsHeader', () => {
  it('is the page’s one h1', () => {
    show();

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
      'Settings',
    );
  });

  it('welcomes the person by name', () => {
    show('Ada');

    expect(screen.getByText(/Welcome, Ada\./)).toBeTruthy();
  });

  it('welcomes without a name when there is none', () => {
    show(null);

    expect(
      screen.getByText(/^Welcome\. This is your personal space/),
    ).toBeTruthy();
  });

  it('has a status region for save feedback', async () => {
    show();

    await waitFor(() => expect(screen.getByRole('status')).toBeTruthy());
  });

  it('announces a retry, keeps its control mounted, and moves focus to the result', async () => {
    let finishRetry: (result: { ok: true }) => void = () => {};
    const save = vi
      .fn<SaveAccountPreferences>()
      .mockResolvedValueOnce({ ok: false, error: 'offline' })
      .mockImplementationOnce(
        () => new Promise((resolve) => (finishRetry = resolve)),
      );
    function Change() {
      const { update } = usePreferenceActions();
      return (
        <button onClick={() => update({ regional: { language: 'fr' } })}>
          Change
        </button>
      );
    }
    render(
      <ModeProvider attribute="class" defaultTheme="system" enableSystem>
        <PreferencesProvider
          session={{
            kind: 'account',
            userId: 'u1',
            stored: {
              preferences: accountPart(settingsDefaults),
              deviceTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
          }}
          saveAccountPreferences={save}
        >
          <SettingsProvider>
            <SettingsHeader />
            <Change />
          </SettingsProvider>
        </PreferencesProvider>
      </ModeProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Change' }));
    const retry = await screen.findByRole('button', { name: 'Try again' });
    retry.focus();
    fireEvent.click(retry);

    await waitFor(() => expect(save).toHaveBeenCalledTimes(2));
    expect(retry).toBe(document.activeElement);
    // Disabled for activation but still focusable, so focus is not dropped.
    expect(retry.getAttribute('aria-disabled')).toBe('true');
    expect(retry.getAttribute('aria-busy')).toBe('true');
    expect(screen.getByRole('status').textContent).toBe(
      'Saving to your account…',
    );

    await act(async () => finishRetry({ ok: true }));
    await waitFor(() =>
      expect(screen.getByRole('status').textContent).toContain('Saved'),
    );
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole('status'));
  });

  it('keeps focus on the control when the retry fails again', async () => {
    const save = vi
      .fn<SaveAccountPreferences>()
      .mockResolvedValue({ ok: false, error: 'offline' });
    showSignedIn(save);
    fireEvent.click(screen.getByRole('button', { name: 'Change' }));
    const retry = await screen.findByRole('button', { name: 'Try again' });
    retry.focus();
    fireEvent.click(retry);
    await waitFor(() => expect(save).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(retry.getAttribute('aria-disabled')).not.toBe('true'),
    );
    expect(document.activeElement).toBe(retry);
    expect(screen.getByRole('status').textContent).toBe(
      'Changes apply on this device, but could not be saved to your account.',
    );
  });

  it('keeps the failure in the status line through a device-only change', async () => {
    const save = vi
      .fn<SaveAccountPreferences>()
      .mockResolvedValue({ ok: false, error: 'offline' });
    showSignedIn(save);
    fireEvent.click(screen.getByRole('button', { name: 'Change' }));
    await screen.findByRole('button', { name: 'Try again' });
    fireEvent.click(screen.getByRole('button', { name: 'Device change' }));
    expect(screen.getByRole('status').textContent).toBe(
      'Changes apply on this device, but could not be saved to your account.',
    );
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
    expect(save).toHaveBeenCalledOnce();
  });

  it('offers no retry when the session has ended, and keeps its wording', async () => {
    const save = vi.fn<SaveAccountPreferences>().mockResolvedValue({
      ok: false,
      error: 'Sign in again to update your profile.',
      signedOut: true,
    });
    showSignedIn(save);
    fireEvent.click(screen.getByRole('button', { name: 'Change' }));
    await waitFor(() =>
      expect(screen.getByRole('status').textContent).toBe(
        'Sign in again to update your profile.',
      ),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Device change' }));
    expect(screen.getByRole('status').textContent).toBe(
      'Sign in again to update your profile.',
    );
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();
  });
});

function showSignedIn(save: SaveAccountPreferences) {
  function Changes() {
    const { update } = usePreferenceActions();
    return (
      <>
        <button onClick={() => update({ regional: { language: 'fr' } })}>
          Change
        </button>
        <button onClick={() => update({ theme: { density: 'compact' } })}>
          Device change
        </button>
      </>
    );
  }
  return render(
    <ModeProvider attribute="class" defaultTheme="system" enableSystem>
      <PreferencesProvider
        session={{
          kind: 'account',
          userId: 'u1',
          stored: {
            preferences: accountPart(settingsDefaults),
            deviceTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
        }}
        saveAccountPreferences={save}
      >
        <SettingsProvider>
          <SettingsHeader />
          <Changes />
        </SettingsProvider>
      </PreferencesProvider>
    </ModeProvider>,
  );
}
