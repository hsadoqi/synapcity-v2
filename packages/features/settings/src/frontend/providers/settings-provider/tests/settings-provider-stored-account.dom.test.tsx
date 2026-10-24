import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ModeProvider } from '@synapcity/frontend-preferences';

import { SettingsProvider } from '..';
import { useSettings } from '../../../hooks/use-settings';

const KEY = 'synapcity-preferences';

function Probe() {
  const { settings, isReady, status } = useSettings();
  return (
    <>
      <span data-testid="ready">{String(isReady)}</span>
      <span data-testid="language">{settings.regional.language}</span>
      <span data-testid="status">{status}</span>
    </>
  );
}

const mount = () =>
  render(
    <ModeProvider attribute="class" defaultTheme="system" enableSystem>
      <SettingsProvider>
        <Probe />
      </SettingsProvider>
    </ModeProvider>,
  );
const ready = () =>
  waitFor(() => expect(screen.getByTestId('ready').textContent).toBe('true'));

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      matches: false,
      media: '(prefers-color-scheme: dark)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
});

describe('SettingsProvider and a stored account entry', () => {
  it('removes a stored password from the browser without losing the preferences', async () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        regional: { language: 'fr' },
        account: { name: 'Ada', email: 'a@b.co', password: 'secret-password' },
      }),
    );

    mount();
    await ready();

    expect(screen.getByTestId('language').textContent).toBe('fr');
    expect(localStorage.getItem(KEY)).not.toContain('secret-password');
    expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual({
      regional: { language: 'fr' },
    });
  });

  it('removes the item and reports no problem when only an account was stored', async () => {
    localStorage.setItem(KEY, JSON.stringify({ account: { password: 'x' } }));

    mount();
    await ready();

    expect(localStorage.getItem(KEY)).toBeNull();
    expect(screen.getByTestId('status').textContent).toBe('');
  });
});
